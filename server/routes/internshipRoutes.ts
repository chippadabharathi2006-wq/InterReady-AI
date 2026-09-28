import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

export const internshipRouter = Router();

// Helper to compute deadline status and remaining days
export function calculateDeadlineInfo(deadlineStr: string) {
  if (!deadlineStr) {
    return { daysRemaining: 0, statusText: 'No deadline', urgency: 'upcoming' };
  }

  const deadline = new Date(deadlineStr);
  deadline.setHours(23, 59, 59, 999);
  const now = new Date();

  // Reset now to beginning of today for fair day-diff
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusText = 'Upcoming';
  let urgency: 'upcoming' | 'approaching' | 'urgent' | 'critical' | 'expired' = 'upcoming';

  if (diffDays < 0) {
    statusText = 'Expired';
    urgency = 'expired';
  } else if (diffDays === 0) {
    statusText = 'Critical (Deadline today)';
    urgency = 'critical';
  } else if (diffDays <= 2) {
    statusText = 'Urgent (1–2 days remaining)';
    urgency = 'urgent';
  } else if (diffDays <= 7) {
    statusText = 'Approaching (3–7 days remaining)';
    urgency = 'approaching';
  } else {
    statusText = 'Upcoming (> 7 days)';
    urgency = 'upcoming';
  }

  return { daysRemaining: diffDays, statusText, urgency };
}

// Get all internships for current user
internshipRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const internships = db.prepare(`
      SELECT i.*, 
             sa.match_percentage, 
             sa.matching_skills, 
             sa.missing_skills
      FROM internships i
      LEFT JOIN skill_analysis sa ON i.id = sa.internship_id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).all(userId) as any[];

    const enriched = internships.map((item) => {
      const deadlineInfo = calculateDeadlineInfo(item.deadline);
      let matchingSkills = [];
      let missingSkills = [];
      try {
        matchingSkills = item.matching_skills ? JSON.parse(item.matching_skills) : [];
        missingSkills = item.missing_skills ? JSON.parse(item.missing_skills) : [];
      } catch {}

      return {
        ...item,
        daysRemaining: deadlineInfo.daysRemaining,
        deadlineStatus: deadlineInfo.statusText,
        deadlineUrgency: deadlineInfo.urgency,
        match_percentage: item.match_percentage !== null ? Number(item.match_percentage) : null,
        matchingSkillsCount: matchingSkills.length,
        missingSkillsCount: missingSkills.length,
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch internships: ' + err.message });
  }
});

// Create internship
internshipRouter.post('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const {
      company,
      role,
      location,
      work_type = 'Remote',
      application_date,
      deadline,
      status = 'Interested',
      application_link = '',
      job_description = '',
      salary = '',
      duration = '',
      notes = '',
    } = req.body;

    if (!company || !role || !deadline) {
      res.status(400).json({ error: 'Company name, role, and application deadline are required.' });
      return;
    }

    const id = crypto.randomUUID();
    const appDate = application_date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO internships (
        id, user_id, company, role, location, work_type, 
        application_date, deadline, status, application_link, 
        job_description, salary, duration, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      company.trim(),
      role.trim(),
      location?.trim() || 'Remote',
      work_type,
      appDate,
      deadline,
      status,
      application_link?.trim() || '',
      job_description?.trim() || '',
      salary?.trim() || '',
      duration?.trim() || '',
      notes?.trim() || ''
    );

    // Initial timeline event
    const eventTitle = status === 'Applied' ? 'Application Submitted' : `Created as ${status}`;
    db.prepare(`
      INSERT INTO timeline_events (id, internship_id, title, date, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(crypto.randomUUID(), id, eventTitle, appDate, 'Internship added to tracker');

    res.status(201).json({ id, message: 'Internship created successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create internship: ' + err.message });
  }
});

// Get single internship details
internshipRouter.get('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const internship = db.prepare(`
      SELECT * FROM internships WHERE id = ? AND user_id = ?
    `).get(id, userId) as any;

    if (!internship) {
      res.status(404).json({ error: 'Internship not found' });
      return;
    }

    const timeline = db.prepare(`
      SELECT * FROM timeline_events WHERE internship_id = ? ORDER BY date ASC, created_at ASC
    `).all(id);

    const skills = db.prepare(`
      SELECT * FROM internship_skills WHERE internship_id = ?
    `).all(id);

    const analysis = db.prepare(`
      SELECT * FROM skill_analysis WHERE internship_id = ?
    `).get(id) as any;

    const questions = db.prepare(`
      SELECT * FROM interview_questions WHERE internship_id = ? ORDER BY created_at ASC
    `).all(id);

    const resumeAnalysis = db.prepare(`
      SELECT * FROM resume_analyses WHERE internship_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(id) as any;

    const deadlineInfo = calculateDeadlineInfo(internship.deadline);

    let parsedAnalysis = null;
    if (analysis) {
      parsedAnalysis = {
        ...analysis,
        matching_skills: JSON.parse(analysis.matching_skills || '[]'),
        missing_skills: JSON.parse(analysis.missing_skills || '[]'),
        additional_skills: JSON.parse(analysis.additional_skills || '[]'),
      };
    }

    let parsedResumeAnalysis = null;
    if (resumeAnalysis) {
      parsedResumeAnalysis = {
        ...resumeAnalysis,
        matching_skills: JSON.parse(resumeAnalysis.matching_skills || '[]'),
        missing_skills: JSON.parse(resumeAnalysis.missing_skills || '[]'),
        strengths: JSON.parse(resumeAnalysis.strengths || '[]'),
        improvements: JSON.parse(resumeAnalysis.improvements || '[]'),
        recommendations: JSON.parse(resumeAnalysis.recommendations || '[]'),
      };
    }

    res.json({
      ...internship,
      daysRemaining: deadlineInfo.daysRemaining,
      deadlineStatus: deadlineInfo.statusText,
      deadlineUrgency: deadlineInfo.urgency,
      timeline: timeline || [],
      extractedSkills: skills || [],
      analysis: parsedAnalysis,
      interviewQuestions: questions || [],
      resumeAnalysis: parsedResumeAnalysis,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve internship: ' + err.message });
  }
});

// Update internship
internshipRouter.put('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      company,
      role,
      location,
      work_type,
      application_date,
      deadline,
      status,
      application_link,
      job_description,
      salary,
      duration,
      notes,
    } = req.body;

    const existing = db.prepare('SELECT * FROM internships WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!existing) {
      res.status(404).json({ error: 'Internship not found' });
      return;
    }

    db.prepare(`
      UPDATE internships SET
        company = COALESCE(?, company),
        role = COALESCE(?, role),
        location = COALESCE(?, location),
        work_type = COALESCE(?, work_type),
        application_date = COALESCE(?, application_date),
        deadline = COALESCE(?, deadline),
        status = COALESCE(?, status),
        application_link = COALESCE(?, application_link),
        job_description = COALESCE(?, job_description),
        salary = COALESCE(?, salary),
        duration = COALESCE(?, duration),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      company,
      role,
      location,
      work_type,
      application_date,
      deadline,
      status,
      application_link,
      job_description,
      salary,
      duration,
      notes,
      id,
      userId
    );

    // Auto-record timeline event if status changed
    if (status && status !== existing.status) {
      const todayStr = new Date().toISOString().split('T')[0];
      db.prepare(`
        INSERT INTO timeline_events (id, internship_id, title, date, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(),
        id,
        `Status updated to ${status}`,
        todayStr,
        `Progressed from ${existing.status} to ${status}`
      );

      // Also create a notification if status is Interview or Selected
      if (status === 'Interview') {
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, link)
          VALUES (?, ?, ?, ?, 'interview', ?)
        `).run(
          crypto.randomUUID(),
          userId,
          `🎯 Interview Round for ${existing.company}`,
          `You advanced to the Interview stage for ${existing.role}. Prepare your custom technical & HR questions now!`,
          `/internships/${id}`
        );
      } else if (status === 'Selected') {
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, link)
          VALUES (?, ?, ?, ?, 'status', ?)
        `).run(
          crypto.randomUUID(),
          userId,
          `🎉 Offer Received from ${existing.company}!`,
          `Congratulations! You received an offer for the ${existing.role} internship.`,
          `/internships/${id}`
        );
      }
    }

    res.json({ message: 'Internship updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update internship: ' + err.message });
  }
});

// Delete internship
internshipRouter.delete('/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    db.prepare('DELETE FROM internships WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Internship deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete internship: ' + err.message });
  }
});

// Add custom timeline event
internshipRouter.post('/:id/timeline', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, date, notes = '' } = req.body;

    const internship = db.prepare('SELECT id FROM internships WHERE id = ? AND user_id = ?').get(id, userId);
    if (!internship) {
      res.status(404).json({ error: 'Internship not found' });
      return;
    }

    if (!title || !date) {
      res.status(400).json({ error: 'Title and date are required' });
      return;
    }

    const eventId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO timeline_events (id, internship_id, title, date, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(eventId, id, title.trim(), date, notes.trim());

    res.status(201).json({ id: eventId, title, date, notes });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add timeline event: ' + err.message });
  }
});

// Delete timeline event
internshipRouter.delete('/:id/timeline/:eventId', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id, eventId } = req.params;

    const internship = db.prepare('SELECT id FROM internships WHERE id = ? AND user_id = ?').get(id, userId);
    if (!internship) {
      res.status(404).json({ error: 'Internship not found' });
      return;
    }

    db.prepare('DELETE FROM timeline_events WHERE id = ? AND internship_id = ?').run(eventId, id);
    res.json({ message: 'Timeline event deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Seed sample internships
internshipRouter.post('/seed-samples', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const samples = [
      {
        company: 'Google',
        role: 'AI/ML Research Intern',
        location: 'Bengaluru, India',
        work_type: 'Hybrid',
        application_date: '2026-09-20',
        deadline: '2026-10-15',
        status: 'Shortlisted',
        application_link: 'https://careers.google.com/jobs/results/',
        salary: '₹1,25,000 / month',
        duration: '3 Months (Summer 2026)',
        job_description: `We are looking for an AI/ML Intern to join Google Research.

Responsibilities:
- Design, train, and benchmark deep neural network architectures for multimodal tasks.
- Collaborate with research scientists to convert cutting-edge academic papers into production systems.
- Optimize inference latency using quantization and model distillation.

Requirements:
- Strong programming skills in Python.
- Deep understanding of Machine Learning and Deep Learning fundamentals.
- Practical experience with TensorFlow or PyTorch.
- Proficiency in SQL, Statistics, and Data Structures & Algorithms.
- Familiarity with Git, Linux environments, and Docker containers.
- Excellent communication and analytical thinking skills.
- Currently pursuing a B.Tech / M.Tech in Computer Science, Data Science, or related STEM field.`,
        timeline: [
          { title: 'Application Submitted', date: '2026-09-20', notes: 'Submitted via Google Careers with resume and project links.' },
          { title: 'Resume Screen Passed', date: '2026-09-25', notes: 'Recruiter reached out for initial screening.' },
          { title: 'Shortlisted for Technical Rounds', date: '2026-09-27', notes: 'Online technical assessment link provided.' },
        ],
      },
      {
        company: 'Microsoft',
        role: 'Software Engineering Intern',
        location: 'Hyderabad, India',
        work_type: 'On-site',
        application_date: '2026-09-18',
        deadline: '2026-10-05',
        status: 'Interview',
        application_link: 'https://careers.microsoft.com',
        salary: '₹1,10,000 / month',
        duration: '2 Months',
        job_description: `Join the Azure Core Engineering team as a Software Engineering Intern.

Responsibilities:
- Build reliable, distributed cloud microservices with high scalability and security standards.
- Write clean, maintainable, and well-tested code in C++, C#, Java, or Python.
- Participate in design reviews, unit testing, and continuous integration pipelines.

Requirements:
- Solid grasp of Object-Oriented Design and Data Structures & Algorithms.
- Experience with Git, GitHub, REST APIs, and Relational Databases (SQL / PostgreSQL).
- Exposure to Cloud platforms (Azure, AWS, or GCP) and Docker is a plus.
- Enrolled in a B.Tech / B.E. in Computer Science or Electrical Engineering.`,
        timeline: [
          { title: 'Application Submitted', date: '2026-09-18', notes: 'Campus hiring portal' },
          { title: 'Online Coding Round Cleared', date: '2026-09-24', notes: 'Solved 2 DSA problems on Codility.' },
          { title: 'Interview Scheduled', date: '2026-09-28', notes: 'Round 1 Technical Interview scheduled for Oct 2.' },
        ],
      },
      {
        company: 'Stripe',
        role: 'Full-Stack Developer Intern',
        location: 'Remote',
        work_type: 'Remote',
        application_date: '2026-09-26',
        deadline: '2026-10-25',
        status: 'Applied',
        application_link: 'https://stripe.com/jobs',
        salary: '$45 / hour',
        duration: '12 Weeks',
        job_description: `Stripe powers online commerce for millions of businesses worldwide. We are looking for Full-Stack Interns to help us build beautiful, intuitive financial infrastructure.

What you will do:
- Develop modern web interfaces using React, TypeScript, and Tailwind CSS.
- Write robust backend services in Node.js, Express, Go, or Ruby.
- Architect clean RESTful APIs and ensure seamless database queries in PostgreSQL.

Requirements:
- Proficient in JavaScript / TypeScript and modern React hooks.
- Familiarity with backend API development (Node.js, Express, or similar).
- Experience with SQL and database modeling.
- Clear written communication and high attention to detail.`,
        timeline: [
          { title: 'Application Submitted', date: '2026-09-26', notes: 'Direct referral through senior engineer.' },
        ],
      },
      {
        company: 'Amazon',
        role: 'Data Analyst Intern',
        location: 'Bengaluru, India',
        work_type: 'Hybrid',
        application_date: '2026-09-15',
        deadline: '2026-09-30',
        status: 'Interview',
        application_link: 'https://amazon.jobs',
        salary: '₹85,000 / month',
        duration: '6 Months',
        job_description: `Amazon Operations is looking for an enthusiastic Data Analyst Intern to transform petabytes of logistics data into actionable business intelligence.

Key Responsibilities:
- Build ETL pipelines and automate reporting dashboards using SQL and Tableau / QuickSight.
- Analyze supply chain bottlenecks using statistical modeling and Python (Pandas, NumPy).
- Present key insights to supply chain managers and directors.

Qualifications:
- Advanced SQL proficiency (joins, window functions, CTEs).
- Strong foundation in Statistics, Probability, and Exploratory Data Analysis.
- Experience with Python data stack (Pandas, NumPy, Matplotlib/Seaborn).
- Good problem-solving and presentation skills.`,
        timeline: [
          { title: 'Application Submitted', date: '2026-09-15', notes: 'Applied on Amazon University Jobs' },
          { title: 'Work Simulation Assessment', date: '2026-09-21', notes: 'Completed business case assessment.' },
          { title: 'Final Interview Scheduled', date: '2026-09-27', notes: 'Panel interview scheduled.' },
        ],
      },
    ];

    for (const s of samples) {
      const internshipId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO internships (
          id, user_id, company, role, location, work_type,
          application_date, deadline, status, application_link,
          job_description, salary, duration
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        internshipId,
        userId,
        s.company,
        s.role,
        s.location,
        s.work_type,
        s.application_date,
        s.deadline,
        s.status,
        s.application_link,
        s.job_description,
        s.salary,
        s.duration
      );

      for (const t of s.timeline) {
        db.prepare(`
          INSERT INTO timeline_events (id, internship_id, title, date, notes)
          VALUES (?, ?, ?, ?, ?)
        `).run(crypto.randomUUID(), internshipId, t.title, t.date, t.notes);
      }
    }

    res.json({ message: 'Sample internships created successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to seed sample internships: ' + err.message });
  }
});
