"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomers = getCustomers;
exports.getCustomerById = getCustomerById;
exports.createCustomer = createCustomer;
exports.updateCustomer = updateCustomer;
exports.deleteCustomer = deleteCustomer;
const db_js_1 = __importDefault(require("../config/db.js"));
const clinicalSchemas_js_1 = require("../validation/clinicalSchemas.js");
const security_js_1 = require("../utils/security.js");
async function getCustomers(req, res) {
    const query = (req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;
    let sql = `
    SELECT c.*,
           MAX(e.exam_date) as latest_exam_date,
           MAX(e.created_at) as latest_exam_created_at,
           COUNT(DISTINCT e.id) as exam_count,
           COUNT(DISTINCT s.id) as sales_count,
           COALESCE(SUM(CASE WHEN DATE(e.created_at) = CURDATE() OR DATE(e.exam_date) = CURDATE() THEN 1 ELSE 0 END) > 0, 0) as examined_today
    FROM customers c
    LEFT JOIN examinations e ON e.customer_id = c.id
    LEFT JOIN sales s ON s.customer_id = c.id
  `;
    let countSql = 'SELECT COUNT(*) as total FROM customers';
    const params = [];
    if (query) {
        const filter = ' WHERE c.customer_code LIKE ? OR c.full_name LIKE ? OR c.phone_number LIKE ?';
        sql += filter;
        countSql += ' WHERE customer_code LIKE ? OR full_name LIKE ? OR phone_number LIKE ?';
        const wild = `%${query}%`;
        params.push(wild, wild, wild);
    }
    sql += ' GROUP BY c.id ORDER BY c.id DESC LIMIT ? OFFSET ?';
    const queryParams = [...params, limit, offset];
    const [countRows] = await db_js_1.default.query(countSql, params);
    const total = countRows[0].total;
    const [rows] = await db_js_1.default.query(sql, queryParams);
    res.json({
        success: true,
        data: {
            customers: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        }
    });
}
async function getCustomerById(req, res) {
    const id = parseInt(String(req.params.id), 10);
    const [custRows] = await db_js_1.default.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
        return;
    }
    const customer = custRows[0];
    // Fetch chronological examinations with prescriptions
    const [examRows] = await db_js_1.default.query(`SELECT e.id as exam_id, e.exam_date, e.clinical_notes, e.created_at as exam_created_at,
            u.full_name as examiner_name,
            p.id as prescription_id, p.od_sph, p.od_cyl, p.od_axis, p.od_add,
            p.os_sph, p.os_cyl, p.os_axis, p.os_add, p.pd, p.is_latest
     FROM examinations e
     LEFT JOIN prescriptions p ON p.examination_id = e.id
     LEFT JOIN users u ON u.id = e.examiner_id
     WHERE e.customer_id = ?
     ORDER BY e.exam_date DESC, e.id DESC`, [id]);
    // Fetch sales and purchase history
    const [saleRows] = await db_js_1.default.query(`SELECT s.id, s.sale_number, s.total_amount, s.paid_amount, s.balance_amount,
            s.payment_status, s.order_status, s.order_type, s.created_at
     FROM sales s
     WHERE s.customer_id = ?
     ORDER BY s.id DESC`, [id]);
    // Fetch communication history
    const [commRows] = await db_js_1.default.query(`SELECT c.id, c.comm_type, c.channel, c.recipient_contact, c.subject, c.message_body,
            c.status, c.dispatched_at, c.created_at, u.full_name as approved_by_name
     FROM communications c
     LEFT JOIN users u ON u.id = c.approved_by_user_id
     WHERE c.customer_id = ?
     ORDER BY c.id DESC`, [id]);
    // Format examinations with structured prescription object and flat properties
    const formattedExams = examRows.map((row) => ({
        id: row.exam_id,
        exam_id: row.exam_id,
        customer_id: id,
        exam_date: row.exam_date,
        clinical_notes: row.clinical_notes,
        examiner_name: row.examiner_name,
        created_at: row.exam_created_at,
        prescription: row.prescription_id ? {
            id: row.prescription_id,
            examination_id: row.exam_id,
            customer_id: id,
            od_sph: Number(row.od_sph),
            od_cyl: Number(row.od_cyl),
            od_axis: Number(row.od_axis),
            od_add: Number(row.od_add || 0),
            os_sph: Number(row.os_sph),
            os_cyl: Number(row.os_cyl),
            os_axis: Number(row.os_axis),
            os_add: Number(row.os_add || 0),
            pd: Number(row.pd),
            is_latest: Boolean(row.is_latest),
        } : null,
        od_sph: row.prescription_id ? Number(row.od_sph) : undefined,
        od_cyl: row.prescription_id ? Number(row.od_cyl) : undefined,
        od_axis: row.prescription_id ? Number(row.od_axis) : undefined,
        od_add: row.prescription_id ? Number(row.od_add || 0) : undefined,
        os_sph: row.prescription_id ? Number(row.os_sph) : undefined,
        os_cyl: row.prescription_id ? Number(row.os_cyl) : undefined,
        os_axis: row.prescription_id ? Number(row.os_axis) : undefined,
        os_add: row.prescription_id ? Number(row.os_add || 0) : undefined,
        pd: row.prescription_id ? Number(row.pd) : undefined,
        is_latest: row.prescription_id ? Boolean(row.is_latest) : false,
    }));
    res.json({
        success: true,
        data: {
            customer,
            examinations: formattedExams,
            sales: saleRows,
            communications: commRows,
        }
    });
}
async function createCustomer(req, res) {
    const data = clinicalSchemas_js_1.customerSchema.parse(req.body);
    // Auto-generate Customer Code: CUST-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const [countResult] = await db_js_1.default.query('SELECT COUNT(*) as cnt FROM customers WHERE customer_code LIKE ?', [`CUST-${currentYear}-%`]);
    const nextSeq = (countResult[0].cnt + 1).toString().padStart(4, '0');
    const customerCode = `CUST-${currentYear}-${nextSeq}`;
    const [result] = await db_js_1.default.query(`INSERT INTO customers (customer_code, full_name, phone_number, email, address, age, gender, occupation, preferences_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        customerCode,
        data.full_name,
        data.phone_number,
        data.email || null,
        data.address || null,
        data.age || null,
        data.gender || null,
        data.occupation || null,
        data.preferences_notes || null,
    ]);
    if (req.user) {
        await (0, security_js_1.logAuditEvent)(req.user.id, 'CREATE_CUSTOMER', 'CUSTOMER', result.insertId, { customerCode, name: data.full_name }, req);
    }
    res.status(201).json({
        success: true,
        data: {
            id: result.insertId,
            customer_code: customerCode,
            ...data,
        }
    });
}
async function updateCustomer(req, res) {
    const id = parseInt(String(req.params.id), 10);
    const data = clinicalSchemas_js_1.customerSchema.parse(req.body);
    const [existing] = await db_js_1.default.query('SELECT id FROM customers WHERE id = ?', [id]);
    if (existing.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
        return;
    }
    await db_js_1.default.query(`UPDATE customers
     SET full_name = ?, phone_number = ?, email = ?, address = ?, age = ?, gender = ?, occupation = ?, preferences_notes = ?
     WHERE id = ?`, [
        data.full_name,
        data.phone_number,
        data.email || null,
        data.address || null,
        data.age || null,
        data.gender || null,
        data.occupation || null,
        data.preferences_notes || null,
        id
    ]);
    if (req.user) {
        await (0, security_js_1.logAuditEvent)(req.user.id, 'UPDATE_CUSTOMER', 'CUSTOMER', id, { name: data.full_name }, req);
    }
    res.json({
        success: true,
        data: { id, ...data }
    });
}
async function deleteCustomer(req, res) {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid customer ID.' } });
        return;
    }
    const connection = await db_js_1.default.getConnection();
    try {
        await connection.beginTransaction();
        const [existing] = await connection.query('SELECT id, customer_code, full_name FROM customers WHERE id = ?', [id]);
        if (existing.length === 0) {
            await connection.rollback();
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
            return;
        }
        const customer = existing[0];
        // 1. Delete associated payments for this customer's sales
        await connection.query('DELETE FROM payments WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = ?)', [id]);
        // 2. Unlink inventory movements referencing this customer's sales
        await connection.query('UPDATE inventory_movements SET reference_sale_id = NULL WHERE reference_sale_id IN (SELECT id FROM sales WHERE customer_id = ?)', [id]);
        // 3. Delete sale items
        await connection.query('DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = ?)', [id]);
        // 4. Delete communications
        await connection.query('DELETE FROM communications WHERE customer_id = ?', [id]);
        // 5. Delete sales
        await connection.query('DELETE FROM sales WHERE customer_id = ?', [id]);
        // 6. Delete prescriptions
        await connection.query('DELETE FROM prescriptions WHERE customer_id = ?', [id]);
        // 7. Delete examinations
        await connection.query('DELETE FROM examinations WHERE customer_id = ?', [id]);
        // 8. Delete customer record
        await connection.query('DELETE FROM customers WHERE id = ?', [id]);
        await connection.commit();
        if (req.user) {
            await (0, security_js_1.logAuditEvent)(req.user.id, 'DELETE_CUSTOMER', 'CUSTOMER', id, { customer_code: customer.customer_code, full_name: customer.full_name }, req);
        }
        res.json({
            success: true,
            message: `Customer ${customer.full_name} (${customer.customer_code}) and all related clinical records deleted successfully.`
        });
    }
    catch (error) {
        await connection.rollback();
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to delete customer record.' }
        });
    }
    finally {
        connection.release();
    }
}
