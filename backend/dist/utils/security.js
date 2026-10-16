"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionToken = createSessionToken;
exports.verifySessionToken = verifySessionToken;
exports.logAuditEvent = logAuditEvent;
const crypto_1 = __importDefault(require("crypto"));
const db_js_1 = __importDefault(require("../config/db.js"));
const SESSION_SECRET = process.env.SESSION_SECRET || 'optopick_default_fallback_secret_key_2026';
/**
 * Creates a signed, tamper-proof session token without external jwt bloat.
 * Payload is base64url encoded with an HMAC-SHA256 signature.
 */
function createSessionToken(userId, username, role, fullName, durationHours = 12) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + durationHours * 3600;
    const payload = { userId, username, role, fullName, iat, exp };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto_1.default.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('base64url');
    return `${payloadStr}.${signature}`;
}
/**
 * Verifies the token signature and expiration. Returns payload if valid, null otherwise.
 */
function verifySessionToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 2)
            return null;
        const [payloadStr, signature] = parts;
        const expectedSignature = crypto_1.default.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('base64url');
        if (!crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            return null;
        }
        const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            return null; // Expired
        }
        return payload;
    }
    catch {
        return null;
    }
}
/**
 * Writes an entry into the audit_logs table for traceability.
 */
async function logAuditEvent(userId, action, entityType, entityId, details, req) {
    try {
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || null) : null;
        const detailsJson = details ? JSON.stringify(details) : null;
        await db_js_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details)
       VALUES (?, ?, ?, ?, ?, ?)`, [userId, action, entityType, entityId, ipAddress, detailsJson]);
    }
    catch (err) {
        console.error('Failed to log audit event:', err);
    }
}
