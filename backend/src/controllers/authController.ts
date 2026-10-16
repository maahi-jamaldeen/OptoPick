import { Request, Response } from 'express';
import argon2 from 'argon2';
import crypto from 'crypto';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createSessionToken, logAuditEvent } from '../utils/security.js';
import { loginSchema, changePasswordSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordWithOtpSchema, resetPasswordSchema } from '../validation/authSchemas.js';
import { sendMail } from '../integrations/mailerClient.js';

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = loginSchema.parse(req.body);

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, email, password_hash, full_name, role, is_active FROM users WHERE username = ? OR email = ?',
    [username, username]
  );

  if (rows.length === 0) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' }
    });
    return;
  }

  const user = rows[0];

  if (!user.is_active) {
    res.status(403).json({
      success: false,
      error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account is deactivated. Please contact clinic administrator.' }
    });
    return;
  }

  const valid = await argon2.verify(user.password_hash, password);
  if (!valid) {
    await logAuditEvent(user.id, 'LOGIN_FAILED', 'USER', user.id, { reason: 'Incorrect password' }, req);
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' }
    });
    return;
  }

  const token = createSessionToken(user.id, user.username, user.role, user.full_name);

  const cookieName = process.env.SESSION_COOKIE_NAME || 'optopick_session';
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 365 days persistent session (no unexpected logouts)
    path: '/',
  });

  await logAuditEvent(user.id, 'LOGIN_SUCCESS', 'USER', user.id, { username: user.username }, req);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
      token,
    }
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const cookieName = process.env.SESSION_COOKIE_NAME || 'optopick_session';
  res.clearCookie(cookieName, { path: '/' });

  if (req.user) {
    await logAuditEvent(req.user.id, 'LOGOUT', 'USER', req.user.id, null, req);
  }

  res.json({
    success: true,
    data: { message: 'Logged out successfully.' }
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in.' } });
    return;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
    [req.user.id]
  );

  if (rows.length === 0 || !rows[0].is_active) {
    res.status(401).json({ success: false, error: { code: 'ACCOUNT_DEACTIVATED', message: 'Account is inactive.' } });
    return;
  }

  const u = rows[0];
  res.json({
    success: true,
    data: {
      user: {
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
      }
    }
  });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in.' } });
    return;
  }

  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT password_hash FROM users WHERE id = ?',
    [req.user.id]
  );

  if (rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    return;
  }

  const matches = await argon2.verify(rows[0].password_hash, currentPassword);
  if (!matches) {
    res.status(400).json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' } });
    return;
  }

  const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
  await logAuditEvent(req.user.id, 'CHANGE_PASSWORD', 'USER', req.user.id, null, req);

  res.json({
    success: true,
    data: { message: 'Password updated successfully.' }
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = forgotPasswordSchema.parse(req.body);

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, email, full_name FROM users WHERE email = ? AND is_active = 1',
    [email]
  );

  // If user does not exist in our system, return a clear, appropriate response
  if (rows.length === 0) {
    res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'No active account found with this email address. Please check your spelling or contact clinic administration.'
      }
    });
    return;
  }

  const user = rows[0];

  // Generate cryptographically secure 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

  await pool.query(
    'UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE id = ?',
    [otp, expiresAt, user.id]
  );

  await logAuditEvent(user.id, 'FORGOT_PASSWORD_OTP_REQUESTED', 'USER', user.id, { email: user.email }, req);

  // Design beautiful branded HTML email for Indian Optician
  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0F4F8; margin: 0; padding: 24px; color: #14213D; }
    .container { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; border: 1px solid #D3DEE8; overflow: hidden; box-shadow: 0 10px 25px rgba(20,33,61,0.08); }
    .header { background: #14213D; padding: 32px 28px; text-align: center; color: #FFFFFF; }
    .logo-badge { display: inline-block; width: 44px; height: 44px; border-radius: 50%; background: conic-gradient(from 200deg, #1E9AA8, #6C5CE7, #C2408E, #1E9AA8); margin-bottom: 12px; }
    .clinic-title { font-size: 22px; font-weight: 700; margin: 0; font-family: Georgia, serif; color: #FFFFFF; }
    .clinic-sub { font-size: 12.5px; opacity: 0.8; margin-top: 4px; color: #CBD6E0; }
    .content { padding: 36px 32px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 14px; color: #14213D; }
    .text { font-size: 14.5px; line-height: 1.6; color: #4A5872; margin-bottom: 24px; }
    .otp-card { background: #F3F7FA; border: 2px dashed #1E9AA8; border-radius: 14px; padding: 20px; text-align: center; margin: 28px 0; }
    .otp-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1E9AA8; margin-bottom: 8px; display: block; }
    .otp-code { font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #14213D; font-family: 'Courier New', monospace; }
    .info-box { background: #FFF2D9; border-left: 4px solid #8F5B00; border-radius: 6px; padding: 12px 16px; font-size: 12.5px; color: #8F5B00; margin: 20px 0; line-height: 1.5; }
    .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748B; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge"></div>
      <h1 class="clinic-title">Indian Optician</h1>
      <div class="clinic-sub">Clinical Refraction & Optical Dispensing Center · Nintavur</div>
    </div>
    <div class="content">
      <div class="greeting">Dear ${user.full_name},</div>
      <div class="text">
        You requested a secure password reset for your <strong>OptoPick</strong> account. Use the 6-digit one-time passcode below to verify your identity and set a new password.
      </div>
      
      <div class="otp-card">
        <span class="otp-label">Password Reset Verification Code</span>
        <div class="otp-code">${otp}</div>
      </div>

      <div class="info-box">
        <strong>Security Notice:</strong> This OTP is strictly confidential and expires in <strong>15 minutes</strong>. If you did not initiate this request, please contact clinic administration immediately.
      </div>
    </div>
    <div class="footer">
      <strong>Indian Optician</strong><br>
      No 67/1, Main Street, Nintavur - 13, Eastern Province, Sri Lanka<br>
      Hotline: +94 67 225 0123 • Email: contact@indianoptician.lk
    </div>
  </div>
</body>
</html>
  `;

  await sendMail({
    to: user.email,
    subject: `[OptoPick] Password Reset OTP: ${otp} - Indian Optician`,
    text: `Hello ${user.full_name},\n\nYour 6-digit verification code to reset your OptoPick password is:\n\n${otp}\n\nThis code is valid for 15 minutes. If you did not request this, please ignore this email or notify clinic administration.\n\nIndian Optician, Main Street, Nintavur.\nHotline: +94 67 225 0123`,
    html: htmlTemplate,
  });

  res.json({
    success: true,
    data: {
      message: 'A 6-digit verification code has been dispatched to your registered email address.',
      email: user.email,
    }
  });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { email, otp } = verifyOtpSchema.parse(req.body);

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, email FROM users WHERE email = ? AND reset_token_hash = ? AND reset_token_expires_at > NOW() AND is_active = 1',
    [email, otp]
  );

  if (rows.length === 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_OR_EXPIRED_OTP',
        message: 'Invalid or expired 6-digit verification code. Please check your email or request a new code.'
      }
    });
    return;
  }

  res.json({
    success: true,
    data: {
      message: 'Verification code confirmed. You may now enter your new password.'
    }
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const body = req.body;
  let userId: number | null = null;

  // Support OTP-based reset
  if (body.otp && body.email) {
    const { email, otp, newPassword } = resetPasswordWithOtpSchema.parse(body);
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND reset_token_hash = ? AND reset_token_expires_at > NOW() AND is_active = 1',
      [email, otp]
    );

    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OR_EXPIRED_OTP',
          message: 'Invalid or expired 6-digit verification code. Please request a new OTP.'
        }
      });
      return;
    }
    userId = rows[0].id;
    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ?',
      [newHash, userId]
    );
  } else {
    // Legacy token-based reset
    const { token, newPassword } = resetPasswordSchema.parse(body);
    if (!token) {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Token or OTP required.' } });
      return;
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE reset_token_hash = ? AND reset_token_expires_at > NOW() AND is_active = 1',
      [tokenHash]
    );

    if (rows.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_OR_EXPIRED_TOKEN', message: 'Password reset token is invalid or has expired.' }
      });
      return;
    }
    userId = rows[0].id;
    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ?',
      [newHash, userId]
    );
  }

  await logAuditEvent(userId, 'PASSWORD_RESET_SUCCESS', 'USER', userId, null, req);

  res.json({
    success: true,
    data: { message: 'Password has been reset successfully. You can now sign in with your new credentials.' }
  });
}
