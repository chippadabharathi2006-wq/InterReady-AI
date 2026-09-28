import { ai, GEMINI_MODEL } from './geminiClient.js';
import { Type } from '@google/genai';

export interface LearningStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedHours: number;
  practicalTask: string;
  freeResources: string[];
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface DetailedRoadmap {
  skillName: string;
  targetRole: string;
  overview: string;
  prerequisites: string[];
  steps: LearningStep[];
}

export async function generateLearningRoadmapWithAI(
  skillName: string,
  targetRole?: string,
  currentStudentSkills: string[] = []
): Promise<DetailedRoadmap> {
  const prompt = `Create a realistic, hands-on, 5-step learning roadmap for a college student needing to learn "${skillName}" for an internship as a "${targetRole || 'Software Engineering Intern'}".

Candidate currently knows: ${currentStudentSkills.join(', ') || 'Basics of programming'}

The roadmap must be practical, self-contained, and progress from foundations to building a demonstrable portfolio project or practical skill test.

Include:
1. overview: High-level purpose and how it applies to this internship
2. prerequisites: What they should know first
3. 5 steps, each having:
   - stepNumber (1 to 5)
   - title
   - description
   - estimatedHours (realistic, e.g. 3-8 hours)
   - practicalTask (specific mini-project or exercise they can code)
   - freeResources (names of official docs, tutorials, or open source exercises)`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skillName: { type: Type.STRING },
            targetRole: { type: Type.STRING },
            overview: { type: Type.STRING },
            prerequisites: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  estimatedHours: { type: Type.INTEGER },
                  practicalTask: { type: Type.STRING },
                  freeResources: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['stepNumber', 'title', 'description', 'estimatedHours', 'practicalTask', 'freeResources'],
              },
            },
          },
          required: ['skillName', 'overview', 'steps'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const stepsWithStatus = (parsed.steps || []).map((s: any, idx: number) => ({
      ...s,
      stepNumber: s.stepNumber || idx + 1,
      status: 'Not Started' as const,
    }));

    return {
      skillName: parsed.skillName || skillName,
      targetRole: parsed.targetRole || targetRole || 'Intern',
      overview: parsed.overview || `Mastering ${skillName} for technical roles.`,
      prerequisites: parsed.prerequisites || [],
      steps: stepsWithStatus,
    };
  } catch (err: any) {
    console.error('Roadmap AI generation error:', err);
    throw new Error('AI Roadmap generation failed: ' + (err.message || 'Unknown error'));
  }
}
