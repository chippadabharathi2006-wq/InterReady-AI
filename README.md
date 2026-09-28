# InternReady AI – Internship Tracker & AI-Powered Skill Gap Analyzer

> **“Track your applications. Understand your skill gaps. Prepare for your next internship.”**

InternReady AI is a full-stack web application designed for college students, B.Tech candidates, and freshers to manage their internship hunt in a single unified dashboard, run real Gemini AI job description analyses, detect skill gaps, compare resumes, and generate targeted interview questions.

---

## 🚀 Key Features

1. **Internship Tracking**:
   - Save and organize opportunities (Company, Role, Work Type, Location, Stipend, Link, Application Date, Deadline, Status).
   - Track application pipeline stages: *Interested, Applied, Shortlisted, Interview, Selected, Rejected, Withdrawn*.
   - Filter by status, work type (Remote, Hybrid, On-site), search by keyword, and sort by deadline or skill match.

2. **Deadline Management & Urgency Indicators**:
   - Dynamic countdown calculation with color-coded and text indicators:
     - `> 7 days`: Upcoming (Green)
     - `3–7 days`: Approaching (Amber)
     - `1–2 days`: Urgent (Orange)
     - `0 days`: Critical (Red)
     - `< 0 days`: Expired (Slate)

3. **Real AI Job Description Analyzer (Gemini 3.8 Flash)**:
   - Paste any real job description or use tracked opportunities.
   - Extracts:
     - Technical Skills (Languages, Frameworks, Core CS)
     - Soft Skills (Communication, Teamwork, Leadership)
     - Tools & Technologies (Docker, Git, AWS, Cloud)
     - Education Requirements (Degree, Majors)
     - Role summary and key duties.

4. **Skill Gap Detection & Transparent Match Metric**:
   - Directly compares the student's declared skills and proficiencies against extracted requirements.
   - Categorizes:
     - Matching Skills (✓)
     - Missing Skills (✗)
     - Additional Candidate Skills
   - Computes transparent alignment percentage (`Matching / Total Required * 100`).
   - Detailed AI Recruiter Gap Summary explaining the relevance of missing proficiencies.

5. **AI Learning Recommendations & 5-Step Roadmaps**:
   - 1-click personalized 5-step roadmaps for any missing skill.
   - Interactive milestone checklist: *Not Started, In Progress, Completed*.
   - When all steps are finished, the skill is automatically verified and added to your student profile!

6. **Real AI Resume Analysis**:
   - Upload resume files (PDF, TXT, DOCX) or edit resume text.
   - Compares resume text strictly against target job descriptions without inventing unlisted experience.
   - Highlights strengths, gaps, and tailored recommendations (e.g., highlighting specific projects).

7. **Tailored AI Interview Preparation**:
   - Synthesizes interview questions customized to the target company, job description, candidate skills, and projects.
   - Categorized into **Technical**, **HR/Behavioral**, **Project-Specific**, and **Role-Specific**.
   - Includes evaluation criteria (what the interviewer wants to hear) and sample answers using the STAR method.

8. **Application Timeline & Notifications**:
   - Milestone timeline for tracking rounds (e.g., Application Submitted → Assessment Cleared → Interview Scheduled → Offer).
   - Real-time notifications for imminent deadlines, interview stages, and skill milestones.

---

## 🏗️ System Architecture

```text
                            STUDENT CLIENT
                       (React 19 + Tailwind CSS)
                                  │
                                  ▼
                        EXPRESS SERVER (PORT 3000)
                     ├── Auth Middleware & Sessions
                     ├── SQLite Database Engine
                     └── API Route Handlers
                                  │
                                  ▼
                           AI SERVICE LAYER
                          (Google GenAI SDK)
                   ┌──────────────┼──────────────┐
                   ▼              ▼              ▼
              Skill Analyzer Resume Analyzer  Interview Coach
             (gemini-3.8-flash)              (STAR Rubrics)
                   └──────────────┬──────────────┘
                                  ▼
                         DATA PERSISTENCE
                        (data/internready.db)
```

---

## 🗄️ Relational Database Design

The system runs on SQLite (`node:sqlite`) with zero external native driver dependencies:

- **`users`**: `id`, `name`, `email`, `password_hash`, `created_at`
- **`sessions`**: `token`, `user_id`, `created_at`
- **`profiles`**: `id`, `user_id`, `college`, `degree`, `branch`, `graduation_year`, `location`, `about`, `resume_name`, `resume_text`, `updated_at`
- **`skills`**: `id`, `name`, `category`
- **`user_skills`**: `id`, `user_id`, `skill_id`, `skill_name`, `proficiency`
- **`user_projects`**: `id`, `user_id`, `title`, `description`, `tech_stack`, `link`
- **`user_certifications`**: `id`, `user_id`, `name`, `issuer`, `issue_date`
- **`internships`**: `id`, `user_id`, `company`, `role`, `location`, `work_type`, `application_date`, `deadline`, `status`, `application_link`, `job_description`, `salary`, `duration`, `notes`
- **`internship_skills`**: `id`, `internship_id`, `skill_name`, `skill_type`
- **`skill_analysis`**: `id`, `internship_id`, `matching_skills`, `missing_skills`, `additional_skills`, `match_percentage`, `summary`
- **`interview_questions`**: `id`, `internship_id`, `question`, `category`, `tips`, `sample_answer`, `difficulty`
- **`timeline_events`**: `id`, `internship_id`, `title`, `date`, `notes`
- **`learning_roadmaps`**: `id`, `user_id`, `internship_id`, `skill_name`, `steps`, `status`
- **`resume_analyses`**: `id`, `user_id`, `internship_id`, `score`, `matching_skills`, `missing_skills`, `strengths`, `improvements`, `recommendations`
- **`notifications`**: `id`, `user_id`, `title`, `message`, `type`, `link`, `is_read`, `created_at`

---

## 🔌 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register`: Create account with salted scrypt password hashing
- `POST /login`: Authenticate and obtain session token
- `POST /demo`: Instant one-click student account access (Aarav Sharma demo)
- `POST /logout`: Terminate active session
- `GET /me`: Get authenticated student profile, skills, and projects

### Student Profile (`/api/profile`)
- `GET /`: Get current student profile
- `PUT /`: Update college, degree, graduation year, location, and bio
- `GET /catalogue-skills`: Autocomplete skills suggestion list
- `POST /skills`: Add skill with proficiency (Beginner, Intermediate, Advanced)
- `DELETE /skills/:id`: Remove skill from profile
- `POST /projects` & `DELETE /projects/:id`: Projects CRUD
- `POST /certifications` & `DELETE /certifications/:id`: Certifications CRUD

### Internships (`/api/internships`)
- `GET /`: List all tracked opportunities with computed deadline urgency
- `POST /`: Add new internship
- `GET /:id`: Retrieve single internship details with extracted skills and timeline
- `PUT /:id`: Update details or status (auto-logs status transition to timeline)
- `DELETE /:id`: Remove internship
- `POST /:id/timeline`: Add custom milestone event
- `POST /seed-samples`: Seed realistic sample internships (Google, Microsoft, Stripe, Amazon)

### AI Services (`/api/ai`)
- `POST /analyze-job/:id`: Gemini extraction of required skills, match %, and gap summary
- `POST /analyze-job-standalone`: Instant analysis for un-saved job descriptions
- `POST /analyze-resume`: Resume text or file screening against target JD
- `POST /generate-questions/:id`: AI interview questions across 4 categories
- `POST /generate-roadmap`: Synthesize 5-step learning path for a missing skill
- `GET /roadmaps`: Fetch active learning roadmaps
- `PUT /roadmaps/:id/step`: Update step status (`Not Started` -> `In Progress` -> `Completed`)

### Dashboard & Notifications (`/api/dashboard`)
- `GET /stats`: Application status counts, upcoming deadlines, top missing skills, role domains
- `GET /notifications`: Alerts for approaching deadlines, interview calls, and completed skills
- `PUT /notifications/:id/read`: Mark notification read
- `POST /notifications/mark-all-read`: Clear all unread badges

---

## 💻 Local Setup in VS Code

### Prerequisites
- Node.js v20+ or v22+
- npm or pnpm

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd internready-ai
npm install
```

### 2. Configure Environment Variables
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Ensure your Gemini API key is configured:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔒 Security & AI Integrity Rules
- Password hashes use unique cryptographic salts via `crypto.scryptSync`.
- API keys are strictly accessed server-side and never leaked to the client bundle.
- Resume screening strictly parses real candidate data and will never hallucinate or invent qualifications.
