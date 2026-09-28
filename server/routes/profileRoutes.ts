import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';

export const profileRouter = Router();

// Get profile details
profileRouter.get('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    const skills = db.prepare('SELECT * FROM user_skills WHERE user_id = ? ORDER BY skill_name ASC').all(userId);
    const projects = db.prepare('SELECT * FROM user_projects WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    const certifications = db.prepare('SELECT * FROM user_certifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    res.json({
      user: req.user,
      profile: profile || {},
      skills: skills || [],
      projects: projects || [],
      certifications: certifications || [],
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch profile: ' + err.message });
  }
});

// Update profile details
profileRouter.put('/', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, college, degree, branch, graduation_year, location, about, resume_text } = req.body;

    if (name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), userId);
      req.user!.name = name.trim();
    }

    const stmt = db.prepare(`
      UPDATE profiles 
      SET college = COALESCE(?, college),
          degree = COALESCE(?, degree),
          branch = COALESCE(?, branch),
          graduation_year = COALESCE(?, graduation_year),
          location = COALESCE(?, location),
          about = COALESCE(?, about),
          resume_text = COALESCE(?, resume_text),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);

    stmt.run(college, degree, branch, graduation_year, location, about, resume_text, userId);

    const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

// Get global skills catalogue for suggestions
profileRouter.get('/catalogue-skills', (req, res) => {
  try {
    const rows = db.prepare('SELECT name, category FROM skills ORDER BY name ASC').all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add skill to student profile
profileRouter.post('/skills', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { skill_name, proficiency = 'Intermediate' } = req.body;

    if (!skill_name || !skill_name.trim()) {
      res.status(400).json({ error: 'Skill name is required' });
      return;
    }

    const cleanName = skill_name.trim();

    // Check if skill exists in user_skills
    const existing = db.prepare('SELECT id FROM user_skills WHERE user_id = ? AND LOWER(skill_name) = LOWER(?)').get(userId, cleanName) as { id: string } | undefined;
    if (existing) {
      // update proficiency
      db.prepare('UPDATE user_skills SET proficiency = ? WHERE id = ?').run(proficiency, existing.id);
      res.json({ message: 'Skill proficiency updated', id: existing.id, skill_name: cleanName, proficiency });
      return;
    }

    const id = crypto.randomUUID();
    const skillId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO user_skills (id, user_id, skill_id, skill_name, proficiency)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, skillId, cleanName, proficiency);

    // Also insert into global skills if missing
    db.prepare('INSERT OR IGNORE INTO skills (id, name, category) VALUES (?, ?, ?)').run(skillId, cleanName, 'Technical');

    res.status(201).json({ id, skill_name: cleanName, proficiency });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add skill: ' + err.message });
  }
});

// Delete skill from profile
profileRouter.delete('/skills/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    db.prepare('DELETE FROM user_skills WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Skill removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete skill: ' + err.message });
  }
});

// Add project
profileRouter.post('/projects', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { title, description, tech_stack, link } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Project title is required' });
      return;
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO user_projects (id, user_id, title, description, tech_stack, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, title.trim(), description || '', tech_stack || '', link || '');

    res.status(201).json({ id, title, description, tech_stack, link });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add project: ' + err.message });
  }
});

// Delete project
profileRouter.delete('/projects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    db.prepare('DELETE FROM user_projects WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Project removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add certification
profileRouter.post('/certifications', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { name, issuer, issue_date, link } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Certification name is required' });
      return;
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO user_certifications (id, user_id, name, issuer, issue_date, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, name.trim(), issuer || '', issue_date || '', link || '');

    res.status(201).json({ id, name, issuer, issue_date, link });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add certification: ' + err.message });
  }
});

// Delete certification
profileRouter.delete('/certifications/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    db.prepare('DELETE FROM user_certifications WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Certification removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
