import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { hashPassword, verifyPassword, createSession, deleteSession, requireAuth, AuthenticatedRequest } from '../auth.js';

export const authRouter = Router();

// Register
authRouter.post('/register', (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'All fields are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const checkUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (checkUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `).run(userId, name.trim(), email.toLowerCase().trim(), passwordHash);

    // Create initial profile
    const profileId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO profiles (id, user_id, college, degree, branch, graduation_year, location, about)
      VALUES (?, ?, '', '', '', '', '', '')
    `).run(profileId, userId);

    const token = createSession(userId);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: userId, name: name.trim(), email: email.toLowerCase().trim() },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed: ' + (err.message || 'Server error') });
  }
});

// Login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(email.toLowerCase().trim()) as {
      id: string;
      name: string;
      email: string;
      password_hash: string;
    } | undefined;

    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = createSession(user.id);

    res.json({
      message: 'Logged in successfully',
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + (err.message || 'Server error') });
  }
});

// Quick Demo / Test User
authRouter.post('/demo', (req, res) => {
  try {
    const demoEmail = 'student@internready.ai';
    let user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(demoEmail) as {
      id: string;
      name: string;
      email: string;
    } | undefined;

    if (!user) {
      const userId = crypto.randomUUID();
      const passwordHash = hashPassword('Student123!');
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash)
        VALUES (?, 'Aarav Sharma', ?, ?)
      `).run(userId, demoEmail, passwordHash);

      const profileId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO profiles (id, user_id, college, degree, branch, graduation_year, location, about, resume_text)
        VALUES (?, ?, 'National Institute of Technology', 'B.Tech', 'Computer Science and Engineering', '2026', 'Bengaluru, India', 'Passionate 3rd-year B.Tech CSE student specializing in AI, Machine Learning, and backend architectures. Seeking high-impact summer internship opportunities.', ?)
      `).run(
        profileId,
        userId,
        `AARAV SHARMA
Email: aarav.sharma@example.edu | Phone: +91 98765 43210
Location: Bengaluru, India | LinkedIn: linkedin.com/in/aarav-sharma | GitHub: github.com/aarav-sharma

EDUCATION
National Institute of Technology, Karnataka (NITK)
B.Tech in Computer Science and Engineering (Graduation: June 2026)
CGPA: 8.9 / 10.0

TECHNICAL SKILLS
Languages: Python, Java, C++, SQL, JavaScript, HTML, CSS
Frameworks & Libraries: Scikit-Learn, Pandas, NumPy, FastAPI, React, Node.js
Core CS: Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems
Tools: Git, GitHub, VS Code, Linux

ACADEMIC PROJECTS
1. MediScan: Deep Learning Chest X-Ray Disease Classifier (Python, PyTorch, OpenCV)
- Built a CNN model classifying 5 pulmonary conditions with 92% ROC-AUC.
- Processed 10,000+ medical images and deployed a FastAPI inference microservice.

2. CloudTrack: Multi-Tenant Task & Budget Management Web App (React, Node.js, PostgreSQL)
- Developed responsive dashboard with JWT authentication, real-time status updates, and charts.
- Managed database schemas and indexed SQL queries for fast queries.

CERTIFICATIONS
- Deep Learning Specialization (Coursera)
- AWS Certified Cloud Practitioner
`
      );

      // Pre-seed skills
      const initialSkills = [
        { name: 'Python', proficiency: 'Advanced' },
        { name: 'SQL', proficiency: 'Advanced' },
        { name: 'Machine Learning', proficiency: 'Intermediate' },
        { name: 'Data Structures', proficiency: 'Advanced' },
        { name: 'Algorithms', proficiency: 'Advanced' },
        { name: 'React', proficiency: 'Intermediate' },
        { name: 'Node.js', proficiency: 'Intermediate' },
        { name: 'Git', proficiency: 'Intermediate' },
        { name: 'HTML', proficiency: 'Advanced' },
        { name: 'CSS', proficiency: 'Intermediate' },
        { name: 'JavaScript', proficiency: 'Intermediate' },
      ];

      const addSkill = db.prepare(`
        INSERT OR IGNORE INTO user_skills (id, user_id, skill_id, skill_name, proficiency)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const s of initialSkills) {
        addSkill.run(crypto.randomUUID(), userId, crypto.randomUUID(), s.name, s.proficiency);
      }

      // Pre-seed 1 project
      db.prepare(`
        INSERT INTO user_projects (id, user_id, title, description, tech_stack, link)
        VALUES (?, ?, 'MediScan Disease Classifier', 'Deep learning pipeline for lung pathology detection using CNNs and FastAPI backend.', 'Python, PyTorch, FastAPI, OpenCV', 'https://github.com/aarav-sharma/mediscan')
      `).run(crypto.randomUUID(), userId);

      user = { id: userId, name: 'Aarav Sharma', email: demoEmail };
    }

    const token = createSession(user.id);
    res.json({
      message: 'Demo login successful',
      token,
      user,
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Demo login failed: ' + (err.message || 'Server error') });
  }
});

// Logout
authRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    deleteSession(token);
  }
  res.json({ message: 'Logged out successfully' });
});

// Get Current User Profile
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
    const skills = db.prepare('SELECT id, skill_name, proficiency FROM user_skills WHERE user_id = ? ORDER BY skill_name ASC').all(user.id);
    const projects = db.prepare('SELECT * FROM user_projects WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    const certs = db.prepare('SELECT * FROM user_certifications WHERE user_id = ? ORDER BY created_at DESC').all(user.id);

    res.json({
      user,
      profile: profile || {},
      skills: skills || [],
      projects: projects || [],
      certifications: certs || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user: ' + err.message });
  }
});
