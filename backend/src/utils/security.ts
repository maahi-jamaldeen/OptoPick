import crypto from 'crypto';
import { Request } from 'express';
import pool from '../config/db.js';

const SESSION_SECRET = process.env.SESSION_SECRET || 'optopick_default_fallback_secret_key_2026';

export interface SessionPayload {
  userId: number;
  username: string;
  role: 'ADMIN' | 'STAFF';
  fullName: string;
  iat: number;
  exp: number;
}

/**
 * Creates a signed, tamper-proof session token without external jwt bloat.
 * Payload is base64url encoded with an HMAC-SHA256 signature.
 */
export function createSessionToken(userId: number, username: string, role: 'ADMIN' | 'STAFF', fullName: string, durationHours = 24 * 365): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + durationHours * 3600;

  const payload: SessionPayload = { userId, username, role, fullName, iat, exp };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies the token signature and expiration. Returns payload if valid, null otherwise.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadStr, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);

    // Persistent active session; verify expiration only if specifically configured
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Writes an entry into the audit_logs table for traceability.
 */
export async function logAuditEvent(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  details: Record<string, any> | null,
  req?: Request
): Promise<void> {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || null) : null;
    const detailsJson = details ? JSON.stringify(details) : null;

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, ipAddress, detailsJson]
    );
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
