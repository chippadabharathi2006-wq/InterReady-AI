const TOKEN_KEY = 'internready_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  demoLogin: () => request<any>('/api/auth/demo', { method: 'POST' }),
  logout: () => request<any>('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request<any>('/api/auth/me'),

  // Profile
  getProfile: () => request<any>('/api/profile'),
  updateProfile: (body: any) => request<any>('/api/profile', { method: 'PUT', body: JSON.stringify(body) }),
  getSkillsCatalogue: () => request<any>('/api/profile/catalogue-skills'),
  addSkill: (skill_name: string, proficiency: string) =>
    request<any>('/api/profile/skills', { method: 'POST', body: JSON.stringify({ skill_name, proficiency }) }),
  deleteSkill: (id: string) => request<any>(`/api/profile/skills/${id}`, { method: 'DELETE' }),
  addProject: (body: any) => request<any>('/api/profile/projects', { method: 'POST', body: JSON.stringify(body) }),
  deleteProject: (id: string) => request<any>(`/api/profile/projects/${id}`, { method: 'DELETE' }),
  addCertification: (body: any) =>
    request<any>('/api/profile/certifications', { method: 'POST', body: JSON.stringify(body) }),
  deleteCertification: (id: string) => request<any>(`/api/profile/certifications/${id}`, { method: 'DELETE' }),

  // Internships
  getInternships: () => request<any>('/api/internships'),
  getInternship: (id: string) => request<any>(`/api/internships/${id}`),
  createInternship: (body: any) => request<any>('/api/internships', { method: 'POST', body: JSON.stringify(body) }),
  updateInternship: (id: string, body: any) =>
    request<any>(`/api/internships/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInternship: (id: string) => request<any>(`/api/internships/${id}`, { method: 'DELETE' }),
  addTimelineEvent: (id: string, body: any) =>
    request<any>(`/api/internships/${id}/timeline`, { method: 'POST', body: JSON.stringify(body) }),
  deleteTimelineEvent: (internshipId: string, eventId: string) =>
    request<any>(`/api/internships/${internshipId}/timeline/${eventId}`, { method: 'DELETE' }),
  seedSamples: () => request<any>('/api/internships/seed-samples', { method: 'POST' }),

  // AI Services
  analyzeJobDescription: (internshipId: string, job_description?: string) =>
    request<any>(`/api/ai/analyze-job/${internshipId}`, { method: 'POST', body: JSON.stringify({ job_description }) }),
  analyzeJobStandalone: (body: { jobDescription: string; roleName?: string; companyName?: string }) =>
    request<any>('/api/ai/analyze-job-standalone', { method: 'POST', body: JSON.stringify(body) }),
  analyzeResume: (formData: FormData) =>
    request<any>('/api/ai/analyze-resume', { method: 'POST', body: formData }),
  generateInterviewQuestions: (internshipId: string, options?: { customFocus?: string; refresh?: boolean }) =>
    request<any>(`/api/ai/generate-questions/${internshipId}`, { method: 'POST', body: JSON.stringify(options || {}) }),
  generateRoadmap: (skillName: string, targetRole?: string, internshipId?: string) =>
    request<any>('/api/ai/generate-roadmap', {
      method: 'POST',
      body: JSON.stringify({ skillName, targetRole, internshipId }),
    }),
  getRoadmaps: () => request<any>('/api/ai/roadmaps'),
  updateRoadmapStep: (roadmapId: string, stepNumber: number, status: string) =>
    request<any>(`/api/ai/roadmaps/${roadmapId}/step`, {
      method: 'PUT',
      body: JSON.stringify({ stepNumber, status }),
    }),

  // Dashboard & Notifications
  getDashboardStats: () => request<any>('/api/dashboard/stats'),
  getNotifications: () => request<any>('/api/dashboard/notifications'),
  markNotificationRead: (id: string) => request<any>(`/api/dashboard/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/api/dashboard/notifications/mark-all-read', { method: 'POST' }),
};
