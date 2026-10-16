import { Request, Response, NextFunction } from 'express';
import { verifySessionToken } from '../utils/security.js';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export type UserRole = 'ADMIN' | 'STAFF';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookieName = process.env.SESSION_COOKIE_NAME || 'optopick_session';
    let token = req.cookies?.[cookieName];

    // Fallback: check Authorization: Bearer <token>
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required. No active session found.' }
      });
      return;
    }

    const payload = verifySessionToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_SESSION', message: 'Session has expired or is invalid. Please log in again.' }
      });
      return;
    }

    // Verify user is active in MySQL
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
      [payload.userId]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      res.status(401).json({
        success: false,
        error: { code: 'ACCOUNT_DEACTIVATED', message: 'User account is inactive or not found.' }
      });
      return;
    }

    const user = rows[0];
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Internal error during session authentication.' }
    });
  }
}

export function roleGuard(allowedRoles: ('ADMIN' | 'STAFF')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' lacks necessary permissions for this resource.`
        }
      });
      return;
    }

    next();
  };
}
