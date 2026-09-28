import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'internready.db');
export const db = new DatabaseSync(dbPath);

// Initialize database schema
export function initDatabase() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      college TEXT DEFAULT '',
      degree TEXT DEFAULT '',
      branch TEXT DEFAULT '',
      graduation_year TEXT DEFAULT '',
      location TEXT DEFAULT '',
      about TEXT DEFAULT '',
      resume_path TEXT DEFAULT '',
      resume_name TEXT DEFAULT '',
      resume_text TEXT DEFAULT '',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'Technical'
    );

    CREATE TABLE IF NOT EXISTS user_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      proficiency TEXT NOT NULL DEFAULT 'Intermediate',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, skill_name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      tech_stack TEXT DEFAULT '',
      link TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_certifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      issuer TEXT DEFAULT '',
      issue_date TEXT DEFAULT '',
      link TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS internships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      location TEXT NOT NULL,
      work_type TEXT NOT NULL DEFAULT 'Remote',
      application_date TEXT NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Interested',
      application_link TEXT DEFAULT '',
      job_description TEXT DEFAULT '',
      salary TEXT DEFAULT '',
      duration TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS internship_skills (
      id TEXT PRIMARY KEY,
      internship_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      skill_type TEXT NOT NULL DEFAULT 'technical',
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skill_analysis (
      id TEXT PRIMARY KEY,
      internship_id TEXT UNIQUE NOT NULL,
      matching_skills TEXT NOT NULL DEFAULT '[]',
      missing_skills TEXT NOT NULL DEFAULT '[]',
      additional_skills TEXT NOT NULL DEFAULT '[]',
      match_percentage INTEGER NOT NULL DEFAULT 0,
      summary TEXT DEFAULT '',
      analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_questions (
      id TEXT PRIMARY KEY,
      internship_id TEXT NOT NULL,
      question TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Technical',
      tips TEXT DEFAULT '',
      sample_answer TEXT DEFAULT '',
      difficulty TEXT DEFAULT 'Medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      internship_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_roadmaps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      internship_id TEXT DEFAULT '',
      skill_name TEXT NOT NULL,
      steps TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'In Progress',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS resume_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      internship_id TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      matching_skills TEXT NOT NULL DEFAULT '[]',
      missing_skills TEXT NOT NULL DEFAULT '[]',
      strengths TEXT NOT NULL DEFAULT '[]',
      improvements TEXT NOT NULL DEFAULT '[]',
      recommendations TEXT NOT NULL DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'deadline',
      link TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default skills catalogue if empty
  const countStmt = db.prepare('SELECT count(*) as count FROM skills');
  const countRow = countStmt.get() as { count: number | bigint };
  if (Number(countRow.count) === 0) {
    const defaultSkills = [
      { name: 'Python', category: 'Programming' },
      { name: 'Java', category: 'Programming' },
      { name: 'C++', category: 'Programming' },
      { name: 'JavaScript', category: 'Programming' },
      { name: 'TypeScript', category: 'Programming' },
      { name: 'SQL', category: 'Database' },
      { name: 'PostgreSQL', category: 'Database' },
      { name: 'MongoDB', category: 'Database' },
      { name: 'Machine Learning', category: 'AI & Data' },
      { name: 'Deep Learning', category: 'AI & Data' },
      { name: 'TensorFlow', category: 'AI & Data' },
      { name: 'PyTorch', category: 'AI & Data' },
      { name: 'Scikit-Learn', category: 'AI & Data' },
      { name: 'Pandas', category: 'AI & Data' },
      { name: 'NumPy', category: 'AI & Data' },
      { name: 'Statistics', category: 'AI & Data' },
      { name: 'Data Structures', category: 'Core CS' },
      { name: 'Algorithms', category: 'Core CS' },
      { name: 'HTML', category: 'Frontend' },
      { name: 'CSS', category: 'Frontend' },
      { name: 'React', category: 'Frontend' },
      { name: 'Node.js', category: 'Backend' },
      { name: 'Express', category: 'Backend' },
      { name: 'FastAPI', category: 'Backend' },
      { name: 'Git', category: 'Tools' },
      { name: 'GitHub', category: 'Tools' },
      { name: 'Docker', category: 'DevOps' },
      { name: 'Kubernetes', category: 'DevOps' },
      { name: 'AWS', category: 'Cloud' },
      { name: 'GCP', category: 'Cloud' },
      { name: 'Communication', category: 'Soft Skills' },
      { name: 'Problem Solving', category: 'Soft Skills' },
      { name: 'Teamwork', category: 'Soft Skills' },
      { name: 'Analytical Thinking', category: 'Soft Skills' }
    ];

    const insertSkill = db.prepare('INSERT INTO skills (id, name, category) VALUES (?, ?, ?)');
    for (const s of defaultSkills) {
      insertSkill.run(crypto.randomUUID(), s.name, s.category);
    }
  }
}
