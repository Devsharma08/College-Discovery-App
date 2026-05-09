import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const protect = (req: any, res: any, next: any): void => {
  const bearer = req.headers.authorization;

  if (!bearer || !bearer.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authorized' });
    return;
  }

  const token = bearer.split('Bearer ')[1].trim();

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token invalid or expired' });
    return;
  }
};
