import { ai, GEMINI_MODEL } from './geminiClient.js';
import { Type } from '@google/genai';

export interface ExtractedJobSkills {
  roleSummary: string;
  technicalSkills: string[];
  softSkills: string[];
  toolsAndTech: string[];
  educationRequirements: string[];
  keyResponsibilities: string[];
  experienceLevel: string;
}

export interface SkillGapAnalysisResult {
  extracted: ExtractedJobSkills;
  matchingSkills: string[];
  missingSkills: string[];
  additionalSkills: string[];
  matchPercentage: number;
  gapSummary: string;
  recommendedLearning: Array<{
    skill: string;
    importance: string;
    learningPath: string[];
  }>;
}

export async function analyzeJobDescriptionWithAI(
  jobDescription: string,
  studentSkills: string[],
  roleName?: string,
  companyName?: string
): Promise<SkillGapAnalysisResult> {
  const prompt = `You are an expert technical recruiter and career coach analyzing an internship posting.

Internship Role: ${roleName || 'Internship'}
Company: ${companyName || 'Technology Company'}
Candidate's Current Declared Skills: ${JSON.stringify(studentSkills)}

Full Job Description:
"""
${jobDescription}
"""

Instructions:
1. Extract ALL explicitly mentioned and heavily implied technical skills, soft skills, tools & technologies, education requirements, and responsibilities.
2. Compare the candidate's declared skills against the job requirements. Normalize variations (e.g., "JS" vs "JavaScript", "Python3" vs "Python", "ML" vs "Machine Learning").
3. Determine:
   - matchingSkills: Skills the candidate has that the job requires.
   - missingSkills: Crucial or preferred skills required by the job that the candidate lacks.
   - additionalSkills: Skills the candidate has that are not specifically mentioned in the job description.
4. Calculate a real, objective skill-match percentage (0-100) based on the proportion of required technical skills & tools the student possesses.
5. Provide a clear, actionable summary explaining the missing skills, why they are important for this specific internship, and how the student can bridge the gap.
6. For each important missing skill (up to 4), generate a concise 5-step learning path.

Return strictly valid JSON matching the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roleSummary: { type: Type.STRING },
            technicalSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            softSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            toolsAndTech: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            educationRequirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            keyResponsibilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            experienceLevel: { type: Type.STRING },
            matchingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            missingSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            additionalSkills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            matchPercentage: { type: Type.INTEGER },
            gapSummary: { type: Type.STRING },
            recommendedLearning: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  importance: { type: Type.STRING },
                  learningPath: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['skill', 'importance', 'learningPath'],
              },
            },
          },
          required: [
            'roleSummary',
            'technicalSkills',
            'softSkills',
            'toolsAndTech',
            'educationRequirements',
            'matchingSkills',
            'missingSkills',
            'matchPercentage',
            'gapSummary',
            'recommendedLearning',
          ],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    return {
      extracted: {
        roleSummary: parsed.roleSummary || 'Role analysis completed',
        technicalSkills: parsed.technicalSkills || [],
        softSkills: parsed.softSkills || [],
        toolsAndTech: parsed.toolsAndTech || [],
        educationRequirements: parsed.educationRequirements || [],
        keyResponsibilities: parsed.keyResponsibilities || [],
        experienceLevel: parsed.experienceLevel || 'Intern / Entry-level',
      },
      matchingSkills: parsed.matchingSkills || [],
      missingSkills: parsed.missingSkills || [],
      additionalSkills: parsed.additionalSkills || [],
      matchPercentage: Math.max(0, Math.min(100, Number(parsed.matchPercentage) || 0)),
      gapSummary: parsed.gapSummary || '',
      recommendedLearning: parsed.recommendedLearning || [],
    };
  } catch (err: any) {
    console.error('Gemini job analysis error:', err);
    throw new Error('AI Job Description Analysis failed: ' + (err.message || 'Unknown error'));
  }
}
