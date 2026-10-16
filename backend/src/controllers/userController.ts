import { Request, Response } from 'express';
import argon2 from 'argon2';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createUserSchema } from '../validation/authSchemas.js';
import { logAuditEvent } from '../utils/security.js';

export async function getUsers(req: Request, res: Response): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users ORDER BY id ASC'
  );

  res.json({
    success: true,
    data: { users: rows }
  });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const data = createUserSchema.parse(req.body);

  // Check unique username and email
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
    [data.username, data.email]
  );

  if (existing.length > 0) {
    const isUsername = existing.some(u => u.username.toLowerCase() === data.username.toLowerCase());
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: isUsername ? 'A user with this username already exists.' : 'A user with this email address already exists.'
      }
    });
    return;
  }

  const hash = await argon2.hash(data.password, { type: argon2.argon2id });

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (username, email, password_hash, full_name, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [data.username, data.email, hash, data.full_name, data.role]
  );

  if (req.user) {
    await logAuditEvent(req.user.id, 'CREATE_USER', 'USER', result.insertId, { username: data.username, role: data.role }, req);
  }

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: result.insertId,
        username: data.username,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        isActive: true,
      }
    }
  });
}

export async function toggleUserStatus(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);

  if (req.user?.id === id) {
    res.status(400).json({
      success: false,
      error: { code: 'SELF_DEACTIVATION', message: 'You cannot deactivate your own administrative account.' }
    });
    return;
  }

  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, is_active, username FROM users WHERE id = ?', [id]);
  if (rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const newStatus = rows[0].is_active ? 0 : 1;
  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

  if (req.user) {
    await logAuditEvent(req.user.id, newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'USER', id, { username: rows[0].username }, req);
  }

  res.json({
    success: true,
    data: { id, isActive: !!newStatus }
  });
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.ip_address, a.details, a.created_at,
            u.username, u.full_name, u.role
     FROM audit_logs a
     LEFT JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC
     LIMIT 100`
  );

  res.json({
    success: true,
    data: { logs: rows }
  });
}

