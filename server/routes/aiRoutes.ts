import { Router } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { analyzeJobDescriptionWithAI } from '../ai/skillAnalyzer.js';
import { parseAndCompareResumeWithAI } from '../ai/resumeAnalyzer.js';
import { generateInterviewQuestionsWithAI } from '../ai/interviewGenerator.js';
import { generateLearningRoadmapWithAI } from '../ai/learningRoadmap.js';

export const aiRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Helper to fetch user's skills as string array
function getUserSkillNames(userId: string): string[] {
  const rows = db.prepare('SELECT skill_name FROM user_skills WHERE user_id = ?').all(userId) as Array<{ skill_name: string }>;
  return rows.map((r) => r.skill_name);
}

// 1. Analyze Job Description for a tracked internship
aiRouter.post('/analyze-job/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { job_description: overrideDesc } = req.body;

    const internship = db.prepare('SELECT * FROM internships WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!internship) {
      res.status(404).json({ error: 'Internship not found' });
      return;
    }

    const jobDescription = overrideDesc?.trim() || internship.job_description?.trim();
    if (!jobDescription) {
      res.status(400).json({ error: 'Job description is empty. Please provide a job description to analyze.' });
      return;
    }

    // Update job description on the internship if modified
    if (overrideDesc && overrideDesc.trim() !== internship.job_description) {
      db.prepare('UPDATE internships SET job_description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(jobDescription, id);
    }

    const studentSkills = getUserSkillNames(userId);

    // Call real Gemini API
    const analysis = await analyzeJobDescriptionWithAI(
      jobDescription,
      studentSkills,
      internship.role,
      internship.company
    );

    // Clear existing extracted skills for this internship
    db.prepare('DELETE FROM internship_skills WHERE internship_id = ?').run(id);

    // Store extracted technical skills
    const insertSkill = db.prepare(`
      INSERT INTO internship_skills (id, internship_id, skill_name, skill_type)
      VALUES (?, ?, ?, ?)
    `);

    for (const skill of analysis.extracted.technicalSkills) {
      insertSkill.run(crypto.randomUUID(), id, skill, 'technical');
    }
    for (const skill of analysis.extracted.softSkills) {
      insertSkill.run(crypto.randomUUID(), id, skill, 'soft');
    }
    for (const tool of analysis.extracted.toolsAndTech) {
      insertSkill.run(crypto.randomUUID(), id, tool, 'tool');
    }
    for (const edu of analysis.extracted.educationRequirements) {
      insertSkill.run(crypto.randomUUID(), id, edu, 'education');
    }

    // Upsert skill_analysis record
    db.prepare(`
      INSERT INTO skill_analysis (
        id, internship_id, matching_skills, missing_skills, 
        additional_skills, match_percentage, summary, analysis_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(internship_id) DO UPDATE SET
        matching_skills = excluded.matching_skills,
        missing_skills = excluded.missing_skills,
        additional_skills = excluded.additional_skills,
        match_percentage = excluded.match_percentage,
        summary = excluded.summary,
        analysis_date = CURRENT_TIMESTAMP
    `).run(
      crypto.randomUUID(),
      id,
      JSON.stringify(analysis.matchingSkills),
      JSON.stringify(analysis.missingSkills),
      JSON.stringify(analysis.additionalSkills),
      analysis.matchPercentage,
      analysis.gapSummary
    );

    // Auto-create notification if there are high missing skills or high match
    if (analysis.matchPercentage >= 75) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, 'status', ?)
      `).run(
        crypto.randomUUID(),
        userId,
        `✨ High Skill Alignment (${analysis.matchPercentage}%) for ${internship.company}`,
        `Your skills strongly match the ${internship.role} requirements!`,
        `/internships/${id}`
      );
    } else if (analysis.missingSkills.length > 0) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, 'learning', ?)
      `).run(
        crypto.randomUUID(),
        userId,
        `📚 ${analysis.missingSkills.length} Skill Gaps Identified for ${internship.company}`,
        `Missing skills like ${analysis.missingSkills.slice(0, 2).join(', ')}. Review recommended learning roadmaps.`,
        `/internships/${id}`
      );
    }

    res.json({
      message: 'Job analyzed successfully',
      analysis,
    });
  } catch (err: any) {
    console.error('Job analysis route error:', err);
    res.status(500).json({ error: err.message || 'We could not analyze this job description right now. Please try again.' });
  }
});

// Standalone quick analyze without saving
aiRouter.post('/analyze-job-standalone', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { jobDescription, roleName, companyName } = req.body;

    if (!jobDescription || !jobDescription.trim()) {
      res.status(400).json({ error: 'Job description is required.' });
      return;
    }

    const studentSkills = getUserSkillNames(userId);
    const analysis = await analyzeJobDescriptionWithAI(
      jobDescription,
      studentSkills,
      roleName,
      companyName
    );

    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
});

// 2. Real AI Resume Analysis & Job Comparison
aiRouter.post('/analyze-resume', requireAuth, upload.single('resumeFile'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { internshipId, resumeText: rawResumeText } = req.body;

    let resumeContent = rawResumeText || '';

    // If file was uploaded
    if (req.file) {
      const buffer = req.file.buffer;
      const originalName = req.file.originalname;

      // Extract text: for plain text / markdown
      if (req.file.mimetype.includes('text') || originalName.endsWith('.txt') || originalName.endsWith('.md')) {
        resumeContent = buffer.toString('utf-8');
      } else {
        // For PDF or DOCX binary files, extract readable ASCII/UTF-8 strings
        // or convert raw text representations
        const rawString = buffer.toString('latin1');
        // Extract readable sequences of words
        const cleaned = rawString.replace(/[^\x20-\x7E\t\n\r]/g, ' ').replace(/\s+/g, ' ');
        if (cleaned.length > 50) {
          resumeContent = cleaned.slice(0, 15000);
        } else {
          resumeContent = buffer.toString('utf-8');
        }
      }

      // Save resume path and text to user profile
      db.prepare(`
        UPDATE profiles SET resume_name = ?, resume_text = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(originalName, resumeContent, userId);
    }

    // If still no resume text, check saved profile resume_text
    if (!resumeContent.trim()) {
      const profile = db.prepare('SELECT resume_text FROM profiles WHERE user_id = ?').get(userId) as any;
      resumeContent = profile?.resume_text || '';
    }

    if (!resumeContent.trim()) {
      res.status(400).json({ error: 'Please upload a resume file or paste your resume text to analyze.' });
      return;
    }

    let jobDescription = '';
    let roleTitle = 'Software Engineer Intern';
    let companyName = 'Tech Company';

    if (internshipId) {
      const internship = db.prepare('SELECT * FROM internships WHERE id = ? AND user_id = ?').get(internshipId, userId) as any;
      if (internship) {
        jobDescription = internship.job_description || '';
        roleTitle = internship.role;
        companyName = internship.company;
      }
    }

    if (!jobDescription.trim()) {
      jobDescription = req.body.jobDescription || 'General Software Engineering / AI internship requiring programming, problem solving, data structures, and teamwork.';
    }

    // Call real Gemini API
    const result = await parseAndCompareResumeWithAI(
      resumeContent,
      jobDescription,
      roleTitle,
      companyName
    );

    // Save to resume_analyses table if internshipId exists
    if (internshipId) {
      const analysisId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO resume_analyses (
          id, user_id, internship_id, score, matching_skills, 
          missing_skills, strengths, improvements, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        analysisId,
        userId,
        internshipId,
        result.score,
        JSON.stringify(result.matchingSkills),
        JSON.stringify(result.missingSkills),
        JSON.stringify(result.strengths),
        JSON.stringify(result.improvements),
        JSON.stringify(result.recommendations)
      );
    }

    res.json({
      message: 'Resume analysis completed successfully',
      result,
    });
  } catch (err: any) {
    console.error('Resume analysis route error:', err);
    res.status(500).json({ error: err.message || 'We could not analyze your resume right now. Please try again.' });
  }
});

// 3. AI Interview Question Generator
aiRouter.post('/generate-questions/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { customFocus, refresh } = req.body;

    const internship = db.prepare('SELECT * FROM internships WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!internship) {
      res.status(404).json({ error: 'Internship not found' });
      return;
    }

    const jobDescription = internship.job_description || `${internship.role} at ${internship.company}`;
    const studentSkills = getUserSkillNames(userId);
    const projects = db.prepare('SELECT title, tech_stack, description FROM user_projects WHERE user_id = ?').all(userId) as any[];
    const projectSummaries = projects.map((p) => `${p.title} (${p.tech_stack}): ${p.description}`);

    // Call Gemini API
    const questions = await generateInterviewQuestionsWithAI(
      jobDescription,
      internship.role,
      internship.company,
      studentSkills,
      projectSummaries,
      customFocus
    );

    // If refresh, clear old questions for this internship
    if (refresh) {
      db.prepare('DELETE FROM interview_questions WHERE internship_id = ?').run(id);
    }

    const insertQ = db.prepare(`
      INSERT INTO interview_questions (
        id, internship_id, question, category, tips, sample_answer, difficulty
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const q of questions) {
      insertQ.run(
        crypto.randomUUID(),
        id,
        q.question,
        q.category,
        q.tips,
        q.sampleAnswer,
        q.difficulty
      );
    }

    const storedQuestions = db.prepare('SELECT * FROM interview_questions WHERE internship_id = ? ORDER BY created_at DESC').all(id);

    res.json({
      message: 'Interview questions generated',
      questions: storedQuestions,
    });
  } catch (err: any) {
    console.error('Interview generator error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate interview questions.' });
  }
});

// 4. Generate Learning Roadmap for a skill
aiRouter.post('/generate-roadmap', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { skillName, targetRole, internshipId } = req.body;

    if (!skillName || !skillName.trim()) {
      res.status(400).json({ error: 'Skill name is required' });
      return;
    }

    const currentSkills = getUserSkillNames(userId);
    const roadmap = await generateLearningRoadmapWithAI(skillName.trim(), targetRole, currentSkills);

    const roadmapId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO learning_roadmaps (id, user_id, internship_id, skill_name, steps, status)
      VALUES (?, ?, ?, ?, ?, 'In Progress')
    `).run(
      roadmapId,
      userId,
      internshipId || '',
      roadmap.skillName,
      JSON.stringify(roadmap.steps)
    );

    res.status(201).json({
      id: roadmapId,
      ...roadmap,
      status: 'In Progress',
    });
  } catch (err: any) {
    console.error('Roadmap error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate learning roadmap.' });
  }
});

// Get user's learning roadmaps
aiRouter.get('/roadmaps', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const rows = db.prepare(`
      SELECT lr.*, i.company, i.role 
      FROM learning_roadmaps lr
      LEFT JOIN internships i ON lr.internship_id = i.id
      WHERE lr.user_id = ?
      ORDER BY lr.updated_at DESC
    `).all(userId) as any[];

    const parsed = rows.map((r) => {
      let steps = [];
      try {
        steps = JSON.parse(r.steps || '[]');
      } catch {}
      const completedCount = steps.filter((s: any) => s.status === 'Completed').length;
      const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

      return {
        ...r,
        steps,
        completedCount,
        totalSteps: steps.length,
        progressPercent,
      };
    });

    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update specific step status in a learning roadmap
aiRouter.put('/roadmaps/:id/step', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { stepNumber, status } = req.body;

    const roadmap = db.prepare('SELECT * FROM learning_roadmaps WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!roadmap) {
      res.status(404).json({ error: 'Learning roadmap not found' });
      return;
    }

    let steps = JSON.parse(roadmap.steps || '[]');
    steps = steps.map((s: any) => {
      if (s.stepNumber === stepNumber) {
        return { ...s, status };
      }
      return s;
    });

    const allCompleted = steps.every((s: any) => s.status === 'Completed');
    const newRoadmapStatus = allCompleted ? 'Completed' : 'In Progress';

    db.prepare(`
      UPDATE learning_roadmaps 
      SET steps = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(JSON.stringify(steps), newRoadmapStatus, id);

    // If just completed, auto-add this skill to user's profile with Beginner/Intermediate level!
    if (allCompleted) {
      const existing = db.prepare('SELECT id FROM user_skills WHERE user_id = ? AND LOWER(skill_name) = LOWER(?)').get(userId, roadmap.skill_name);
      if (!existing) {
        db.prepare(`
          INSERT INTO user_skills (id, user_id, skill_id, skill_name, proficiency)
          VALUES (?, ?, ?, ?, 'Intermediate')
        `).run(crypto.randomUUID(), userId, crypto.randomUUID(), roadmap.skill_name);
      }

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, 'learning', '/learning')
      `).run(
        crypto.randomUUID(),
        userId,
        `✅ You completed ${roadmap.skill_name}!`,
        `All 5 learning roadmap steps completed! ${roadmap.skill_name} has been added to your profile skills.`,
        '/profile'
      );
    }

    res.json({ message: 'Roadmap step updated', steps, status: newRoadmapStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
