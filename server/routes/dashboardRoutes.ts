import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../auth.js';
import { calculateDeadlineInfo } from './internshipRoutes.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const allInternships = db.prepare(`
      SELECT i.*, sa.match_percentage, sa.missing_skills, sa.matching_skills
      FROM internships i
      LEFT JOIN skill_analysis sa ON i.id = sa.internship_id
      WHERE i.user_id = ?
      ORDER BY i.deadline ASC
    `).all(userId) as any[];

    const statusCounts: Record<string, number> = {
      Interested: 0,
      Applied: 0,
      Shortlisted: 0,
      Interview: 0,
      Selected: 0,
      Rejected: 0,
      Withdrawn: 0,
    };

    let totalMatchSum = 0;
    let matchCount = 0;
    const missingSkillsFrequency: Record<string, number> = {};
    const rolesFrequency: Record<string, number> = {};
    const monthlyApplications: Record<string, number> = {};

    const upcomingDeadlines: any[] = [];

    for (const item of allInternships) {
      // Status tally
      if (statusCounts[item.status] !== undefined) {
        statusCounts[item.status]++;
      } else {
        statusCounts[item.status] = 1;
      }

      // Match percentage
      if (item.match_percentage !== null && item.match_percentage !== undefined) {
        totalMatchSum += Number(item.match_percentage);
        matchCount++;
      }

      // Deadlines
      const deadlineInfo = calculateDeadlineInfo(item.deadline);
      if (deadlineInfo.urgency !== 'expired') {
        upcomingDeadlines.push({
          id: item.id,
          company: item.company,
          role: item.role,
          deadline: item.deadline,
          status: item.status,
          daysRemaining: deadlineInfo.daysRemaining,
          statusText: deadlineInfo.statusText,
          urgency: deadlineInfo.urgency,
        });
      }

      // Roles breakdown
      let roleCategory = 'Other';
      const roleLower = item.role.toLowerCase();
      if (roleLower.includes('ai') || roleLower.includes('ml') || roleLower.includes('machine learning') || roleLower.includes('deep learning')) {
        roleCategory = 'AI / ML';
      } else if (roleLower.includes('data') || roleLower.includes('analyst') || roleLower.includes('analytics')) {
        roleCategory = 'Data Science & Analytics';
      } else if (roleLower.includes('front') || roleLower.includes('react') || roleLower.includes('web')) {
        roleCategory = 'Web & Frontend';
      } else if (roleLower.includes('full') || roleLower.includes('stack')) {
        roleCategory = 'Full-Stack Development';
      } else if (roleLower.includes('soft') || roleLower.includes('sde') || roleLower.includes('engineer') || roleLower.includes('backend')) {
        roleCategory = 'Software Engineering (SDE)';
      } else if (roleLower.includes('devops') || roleLower.includes('cloud')) {
        roleCategory = 'Cloud & DevOps';
      }
      rolesFrequency[roleCategory] = (rolesFrequency[roleCategory] || 0) + 1;

      // Monthly tally
      if (item.application_date) {
        const monthYear = item.application_date.slice(0, 7); // YYYY-MM
        monthlyApplications[monthYear] = (monthlyApplications[monthYear] || 0) + 1;
      }

      // Missing skills aggregation
      if (item.missing_skills) {
        try {
          const missing = JSON.parse(item.missing_skills);
          if (Array.isArray(missing)) {
            for (const skill of missing) {
              const clean = skill.trim();
              if (clean) {
                missingSkillsFrequency[clean] = (missingSkillsFrequency[clean] || 0) + 1;
              }
            }
          }
        } catch {}
      }
    }

    // Sort upcoming deadlines by days remaining ascending
    upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

    // Format top missing skills
    const topMissingSkills = Object.entries(missingSkillsFrequency)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Learning roadmaps stats
    const roadmaps = db.prepare('SELECT steps, status FROM learning_roadmaps WHERE user_id = ?').all(userId) as any[];
    let totalRoadmaps = roadmaps.length;
    let completedRoadmaps = roadmaps.filter((r) => r.status === 'Completed').length;

    // Student profile stats
    const userSkillsCount = (db.prepare('SELECT count(*) as count FROM user_skills WHERE user_id = ?').get(userId) as any)?.count || 0;

    res.json({
      totalApplications: allInternships.length,
      statusCounts,
      averageMatchPercentage: matchCount > 0 ? Math.round(totalMatchSum / matchCount) : 0,
      upcomingDeadlines: upcomingDeadlines.slice(0, 6),
      topMissingSkills,
      rolesFrequency,
      monthlyApplications,
      totalRoadmaps,
      completedRoadmaps,
      userSkillsCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats: ' + err.message });
  }
});

// Notifications
dashboardRouter.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    // First generate dynamic deadline notifications if approaching in 1-2 days
    const urgentInternships = db.prepare(`
      SELECT id, company, role, deadline 
      FROM internships 
      WHERE user_id = ? AND status NOT IN ('Selected', 'Rejected', 'Withdrawn')
    `).all(userId) as any[];

    for (const item of urgentInternships) {
      const deadlineInfo = calculateDeadlineInfo(item.deadline);
      if (deadlineInfo.daysRemaining >= 0 && deadlineInfo.daysRemaining <= 2) {
        const title = deadlineInfo.daysRemaining === 0
          ? `⚠️ ${item.company} deadline is TODAY!`
          : `⚠️ ${item.company} deadline is in ${deadlineInfo.daysRemaining} day(s)`;

        // Check if we already have this notification
        const existing = db.prepare(`
          SELECT id FROM notifications 
          WHERE user_id = ? AND title = ? AND date(created_at) = date('now')
        `).get(userId, title);

        if (!existing) {
          db.prepare(`
            INSERT INTO notifications (id, user_id, title, message, type, link)
            VALUES (?, ?, ?, ?, 'deadline', ?)
          `).run(
            crypto.randomUUID(),
            userId,
            title,
            `Application for ${item.role} at ${item.company} closes on ${item.deadline}. Submit before the cutoff!`,
            `/internships/${item.id}`
          );
        }
      }
    }

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all(userId) as any[];

    const unreadCount = notifications.filter((n) => n.is_read === 0).length;

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark single notification read
dashboardRouter.put('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ message: 'Marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications read
dashboardRouter.post('/notifications/mark-all-read', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
