import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

export function createSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const stmt = db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)');
  stmt.run(token, userId);
  return token;
}

export function deleteSession(token: string): void {
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

export function getUserByToken(token: string) {
  const stmt = db.prepare(`
    SELECT u.id, u.name, u.email 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.token = ?
  `);
  return stmt.get(token) as { id: string; name: string; email: string } | undefined;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const user = getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  req.user = user;
  next();
}
