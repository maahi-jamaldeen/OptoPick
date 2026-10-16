"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.createUser = createUser;
exports.toggleUserStatus = toggleUserStatus;
exports.getAuditLogs = getAuditLogs;
const argon2_1 = __importDefault(require("argon2"));
const db_js_1 = __importDefault(require("../config/db.js"));
const authSchemas_js_1 = require("../validation/authSchemas.js");
const security_js_1 = require("../utils/security.js");
async function getUsers(req, res) {
    const [rows] = await db_js_1.default.query('SELECT id, username, email, full_name, role, is_active, created_at, updated_at FROM users ORDER BY id ASC');
    res.json({
        success: true,
        data: { users: rows }
    });
}
async function createUser(req, res) {
    const data = authSchemas_js_1.createUserSchema.parse(req.body);
    // Check unique username and email
    const [existing] = await db_js_1.default.query('SELECT id, username, email FROM users WHERE username = ? OR email = ?', [data.username, data.email]);
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
    const hash = await argon2_1.default.hash(data.password, { type: argon2_1.default.argon2id });
    const [result] = await db_js_1.default.query(`INSERT INTO users (username, email, password_hash, full_name, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`, [data.username, data.email, hash, data.full_name, data.role]);
    if (req.user) {
        await (0, security_js_1.logAuditEvent)(req.user.id, 'CREATE_USER', 'USER', result.insertId, { username: data.username, role: data.role }, req);
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
async function toggleUserStatus(req, res) {
    const id = parseInt(String(req.params.id), 10);
    if (req.user?.id === id) {
        res.status(400).json({
            success: false,
            error: { code: 'SELF_DEACTIVATION', message: 'You cannot deactivate your own administrative account.' }
        });
        return;
    }
    const [rows] = await db_js_1.default.query('SELECT id, is_active, username FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found.' } });
        return;
    }
    const newStatus = rows[0].is_active ? 0 : 1;
    await db_js_1.default.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);
    if (req.user) {
        await (0, security_js_1.logAuditEvent)(req.user.id, newStatus ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', 'USER', id, { username: rows[0].username }, req);
    }
    res.json({
        success: true,
        data: { id, isActive: !!newStatus }
    });
}
async function getAuditLogs(req, res) {
    const [rows] = await db_js_1.default.query(`SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.ip_address, a.details, a.created_at,
            u.username, u.full_name, u.role
     FROM audit_logs a
     LEFT JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC
     LIMIT 100`);
    res.json({
        success: true,
        data: { logs: rows }
    });
}
