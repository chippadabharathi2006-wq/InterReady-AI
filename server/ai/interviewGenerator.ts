import { ai, GEMINI_MODEL } from './geminiClient.js';
import { Type } from '@google/genai';

export interface GeneratedQuestion {
  question: string;
  category: 'Technical' | 'HR' | 'Project' | 'Role-Specific';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tips: string;
  sampleAnswer: string;
}

export async function generateInterviewQuestionsWithAI(
  jobDescription: string,
  roleTitle: string,
  companyName: string,
  candidateSkills: string[],
  candidateProjects: string[] = [],
  customFocus?: string
): Promise<GeneratedQuestion[]> {
  const prompt = `You are a senior tech interviewer at ${companyName || 'a top tech company'}.
You are preparing a realistic, high-impact interview session for an applicant applying for the role of ${roleTitle}.

Job Description & Requirements:
"""
${jobDescription}
"""

Candidate Profile:
- Skills: ${candidateSkills.join(', ') || 'Not specified'}
- Key Projects / Background: ${candidateProjects.join('; ') || 'General Engineering Student'}
${customFocus ? `- Specific Focus requested by student: ${customFocus}` : ''}

Generate 8-10 diverse, top-tier interview questions spanning:
1. Technical Questions: Testing core technical concepts (programming, data structures, algorithms, domain specifics like ML, SQL, APIs, etc.).
2. HR Questions: Behavioral, culture, soft skills, motivations (e.g., "Tell me about yourself", "Why this company?", "How do you handle deadlines?").
3. Project Questions: Probing deep into system choices, challenges faced, debugging, architecture, and technology trade-offs.
4. Role-Specific Questions: Scenarios, system problems, or practical duties directly mentioned in this job description.

For each question, provide:
- question
- category ('Technical', 'HR', 'Project', or 'Role-Specific')
- difficulty ('Easy', 'Medium', 'Hard')
- tips (what the interviewer wants to hear / key red flags)
- sampleAnswer (structured, professional answer guide / STAR method points)`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              category: {
                type: Type.STRING,
                enum: ['Technical', 'HR', 'Project', 'Role-Specific'],
              },
              difficulty: {
                type: Type.STRING,
                enum: ['Easy', 'Medium', 'Hard'],
              },
              tips: { type: Type.STRING },
              sampleAnswer: { type: Type.STRING },
            },
            required: ['question', 'category', 'difficulty', 'tips', 'sampleAnswer'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return parsed;
  } catch (err: any) {
    console.error('Interview question generation error:', err);
    throw new Error('Interview question generation failed: ' + (err.message || 'Unknown error'));
  }
}
