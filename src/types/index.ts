export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Profile {
  id?: string;
  user_id?: string;
  college: string;
  degree: string;
  branch: string;
  graduation_year: string;
  location: string;
  about: string;
  resume_path?: string;
  resume_name?: string;
  resume_text?: string;
}

export interface UserSkill {
  id: string;
  skill_name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface UserProject {
  id: string;
  title: string;
  description: string;
  tech_stack: string;
  link: string;
}

export interface UserCertification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  link: string;
}

export type InternshipStatus =
  | 'Interested'
  | 'Applied'
  | 'Shortlisted'
  | 'Interview'
  | 'Selected'
  | 'Rejected'
  | 'Withdrawn';

export type WorkType = 'Remote' | 'Hybrid' | 'On-site';

export interface TimelineEvent {
  id: string;
  internship_id: string;
  title: string;
  date: string;
  notes: string;
}

export interface ExtractedSkill {
  id: string;
  internship_id: string;
  skill_name: string;
  skill_type: 'technical' | 'soft' | 'tool' | 'education';
}

export interface SkillAnalysisData {
  id?: string;
  internship_id?: string;
  matching_skills: string[];
  missing_skills: string[];
  additional_skills: string[];
  match_percentage: number;
  summary: string;
  analysis_date?: string;
}

export interface InterviewQuestion {
  id: string;
  internship_id: string;
  question: string;
  category: 'Technical' | 'HR' | 'Project' | 'Role-Specific';
  tips: string;
  sample_answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_at?: string;
}

export interface ResumeAnalysisData {
  id?: string;
  score: number;
  matching_skills?: string[];
  missing_skills?: string[];
  matchingSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  improvements?: string[];
  recommendations?: string[];
  parsedResume?: {
    candidateName: string;
    email: string;
    phone: string;
    education: Array<{ degree: string; institution: string; year: string; gpa?: string }>;
    skills: string[];
    projects: Array<{ title: string; techStack: string[]; description: string }>;
    experience: Array<{ role: string; organization: string; duration: string; summary: string }>;
    certifications: string[];
  };
}

export interface Internship {
  id: string;
  user_id?: string;
  company: string;
  role: string;
  location: string;
  work_type: WorkType;
  application_date: string;
  deadline: string;
  status: InternshipStatus;
  application_link: string;
  job_description: string;
  salary: string;
  duration: string;
  notes: string;
  daysRemaining: number;
  deadlineStatus: string;
  deadlineUrgency: 'upcoming' | 'approaching' | 'urgent' | 'critical' | 'expired';
  match_percentage: number | null;
  matchingSkillsCount?: number;
  missingSkillsCount?: number;
  timeline?: TimelineEvent[];
  extractedSkills?: ExtractedSkill[];
  analysis?: SkillAnalysisData | null;
  interviewQuestions?: InterviewQuestion[];
  resumeAnalysis?: ResumeAnalysisData | null;
}

export interface LearningStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedHours: number;
  practicalTask: string;
  freeResources: string[];
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface LearningRoadmap {
  id: string;
  user_id?: string;
  internship_id?: string;
  company?: string;
  role?: string;
  skill_name: string;
  steps: LearningStep[];
  status: 'In Progress' | 'Completed';
  completedCount: number;
  totalSteps: number;
  progressPercent: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'interview' | 'learning' | 'status';
  link: string;
  is_read: number;
  created_at: string;
}

export interface DashboardStats {
  totalApplications: number;
  statusCounts: Record<InternshipStatus, number>;
  averageMatchPercentage: number;
  upcomingDeadlines: Array<{
    id: string;
    company: string;
    role: string;
    deadline: string;
    status: InternshipStatus;
    daysRemaining: number;
    statusText: string;
    urgency: 'upcoming' | 'approaching' | 'urgent' | 'critical' | 'expired';
  }>;
  topMissingSkills: Array<{ skill: string; count: number }>;
  rolesFrequency: Record<string, number>;
  monthlyApplications: Record<string, number>;
  totalRoadmaps: number;
  completedRoadmaps: number;
  userSkillsCount: number;
}
