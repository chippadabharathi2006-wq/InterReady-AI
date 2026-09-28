import { ai, GEMINI_MODEL } from './geminiClient.js';
import { Type } from '@google/genai';

export interface ExtractedResumeData {
  candidateName: string;
  email: string;
  phone: string;
  education: Array<{ degree: string; institution: string; year: string; gpa?: string }>;
  skills: string[];
  projects: Array<{ title: string; techStack: string[]; description: string }>;
  experience: Array<{ role: string; organization: string; duration: string; summary: string }>;
  certifications: string[];
}

export interface ResumeComparisonResult {
  parsedResume: ExtractedResumeData;
  score: number; // 0 to 100
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  alignmentSummary: string;
}

export async function parseAndCompareResumeWithAI(
  resumeText: string,
  jobDescription: string,
  roleTitle?: string,
  companyName?: string
): Promise<ResumeComparisonResult> {
  const prompt = `You are a rigorous technical hiring manager and resume screening AI evaluating a student's resume for an internship.

TARGET INTERNSHIP:
Role: ${roleTitle || 'Internship'}
Company: ${companyName || 'Target Company'}
Job Description:
"""
${jobDescription}
"""

CANDIDATE'S RESUME TEXT:
"""
${resumeText}
"""

CRITICAL RULES:
1. ONLY extract information that is explicitly stated in the resume text. NEVER invent skills, projects, degrees, companies, or certifications.
2. Accurately extract all stated skills, projects, experience, certifications, and education.
3. Compare the resume against the target internship requirements.
4. Calculate an honest resume readiness match score (0-100) reflecting how well this student's actual resume matches the required skills and experience level.
5. Provide specific, honest strengths, areas of improvement, and concrete advice (e.g. "Highlight relevant Machine Learning projects when applying for this role" or "Add metrics to your React project").
`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  year: { type: Type.STRING },
                  gpa: { type: Type.STRING },
                },
                required: ['degree', 'institution'],
              },
            },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  techStack: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  description: { type: Type.STRING },
                },
                required: ['title'],
              },
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  organization: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  summary: { type: Type.STRING },
                },
                required: ['role', 'organization'],
              },
            },
            certifications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            score: { type: Type.INTEGER },
            matchingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            alignmentSummary: { type: Type.STRING },
          },
          required: [
            'candidateName',
            'skills',
            'score',
            'matchingSkills',
            'missingSkills',
            'strengths',
            'improvements',
            'recommendations',
            'alignmentSummary',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      parsedResume: {
        candidateName: parsed.candidateName || 'Candidate',
        email: parsed.email || '',
        phone: parsed.phone || '',
        education: parsed.education || [],
        skills: parsed.skills || [],
        projects: parsed.projects || [],
        experience: parsed.experience || [],
        certifications: parsed.certifications || [],
      },
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      matchingSkills: parsed.matchingSkills || [],
      missingSkills: parsed.missingSkills || [],
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      recommendations: parsed.recommendations || [],
      alignmentSummary: parsed.alignmentSummary || '',
    };
  } catch (err: any) {
    console.error('Resume AI analysis error:', err);
    throw new Error('AI Resume Analysis failed: ' + (err.message || 'Unknown error'));
  }
}
