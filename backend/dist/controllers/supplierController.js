"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuppliers = getSuppliers;
exports.createSupplier = createSupplier;
const db_js_1 = __importDefault(require("../config/db.js"));
const zod_1 = require("zod");
const security_js_1 = require("../utils/security.js");
const supplierSchema = zod_1.z.object({
    supplier_code: zod_1.z.string().min(2).max(20),
    name: zod_1.z.string().min(2).max(100),
    contact_person: zod_1.z.string().max(100).optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().min(7).max(20),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    address: zod_1.z.string().optional().or(zod_1.z.literal('')),
});
async function getSuppliers(req, res) {
    const [rows] = await db_js_1.default.query('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name ASC');
    res.json({ success: true, data: { suppliers: rows } });
}
async function createSupplier(req, res) {
    const data = supplierSchema.parse(req.body);
    const [result] = await db_js_1.default.query(`INSERT INTO suppliers (supplier_code, name, contact_person, phone, email, address, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`, [
        data.supplier_code,
        data.name,
        data.contact_person || null,
        data.phone,
        data.email || null,
        data.address || null,
    ]);
    await (0, security_js_1.logAuditEvent)(req.user.id, 'CREATE_SUPPLIER', 'SUPPLIER', result.insertId, { name: data.name }, req);
    res.status(201).json({
        success: true,
        data: { id: result.insertId, ...data }
    });
}
