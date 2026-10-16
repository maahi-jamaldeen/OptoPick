"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExamination = createExamination;
exports.getPrescriptionHistory = getPrescriptionHistory;
exports.getLatestPrescription = getLatestPrescription;
const db_js_1 = __importDefault(require("../config/db.js"));
const clinicalSchemas_js_1 = require("../validation/clinicalSchemas.js");
const security_js_1 = require("../utils/security.js");
async function createExamination(req, res) {
    const data = clinicalSchemas_js_1.prescriptionSchema.parse(req.body);
    const examinerId = req.user.id;
    // Verify customer exists
    const [custRows] = await db_js_1.default.query('SELECT id, full_name FROM customers WHERE id = ?', [data.customer_id]);
    if (custRows.length === 0) {
        res.status(404).json({ success: false, error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer does not exist.' } });
        return;
    }
    const connection = await db_js_1.default.getConnection();
    try {
        await connection.beginTransaction();
        // 1. Insert examination record
        const [examResult] = await connection.query(`INSERT INTO examinations (customer_id, examiner_id, exam_date, clinical_notes)
       VALUES (?, ?, ?, ?)`, [data.customer_id, examinerId, data.exam_date, data.clinical_notes || null]);
        const examId = examResult.insertId;
        // 2. Mark previous prescriptions as not latest
        await connection.query('UPDATE prescriptions SET is_latest = 0 WHERE customer_id = ?', [data.customer_id]);
        // 3. Insert new prescription record
        const [rxResult] = await connection.query(`INSERT INTO prescriptions
       (examination_id, customer_id, od_sph, od_cyl, od_axis, od_add, os_sph, os_cyl, os_axis, os_add, pd, is_latest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [
            examId,
            data.customer_id,
            data.od_sph,
            data.od_cyl,
            data.od_axis,
            data.od_add || 0.00,
            data.os_sph,
            data.os_cyl,
            data.os_axis,
            data.os_add || 0.00,
            data.pd,
        ]);
        await connection.commit();
        await (0, security_js_1.logAuditEvent)(examinerId, 'RECORD_EXAMINATION', 'EXAMINATION', examId, { customerId: data.customer_id, prescriptionId: rxResult.insertId }, req);
        res.status(201).json({
            success: true,
            data: {
                examination_id: examId,
                prescription_id: rxResult.insertId,
                ...data,
            }
        });
    }
    catch (err) {
        await connection.rollback();
        throw err;
    }
    finally {
        connection.release();
    }
}
async function getPrescriptionHistory(req, res) {
    const customerId = parseInt(String(req.params.customerId), 10);
    const [rows] = await db_js_1.default.query(`SELECT e.id as exam_id, e.exam_date, e.clinical_notes, e.created_at as recorded_at,
            u.full_name as examiner_name,
            p.id as prescription_id, p.od_sph, p.od_cyl, p.od_axis, p.od_add,
            p.os_sph, p.os_cyl, p.os_axis, p.os_add, p.pd, p.is_latest
     FROM examinations e
     JOIN prescriptions p ON p.examination_id = e.id
     JOIN users u ON u.id = e.examiner_id
     WHERE e.customer_id = ?
     ORDER BY e.exam_date DESC, e.id DESC`, [customerId]);
    res.json({
        success: true,
        data: { history: rows }
    });
}
async function getLatestPrescription(req, res) {
    const customerId = parseInt(String(req.params.customerId), 10);
    const [rows] = await db_js_1.default.query(`SELECT p.*, e.exam_date, e.clinical_notes, u.full_name as examiner_name
     FROM prescriptions p
     JOIN examinations e ON e.id = p.examination_id
     JOIN users u ON u.id = e.examiner_id
     WHERE p.customer_id = ? AND p.is_latest = 1
     LIMIT 1`, [customerId]);
    if (rows.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NO_PRESCRIPTION', message: 'No active prescription found for this customer.' } });
        return;
    }
    res.json({
        success: true,
        data: { prescription: rows[0] }
    });
}
