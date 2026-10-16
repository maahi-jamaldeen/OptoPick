import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { customerSchema } from '../validation/clinicalSchemas.js';
import { logAuditEvent } from '../utils/security.js';

export async function getCustomers(req: Request, res: Response): Promise<void> {
  const query = (req.query.q as string || '').trim();
  const dispensingEligible = req.query.dispensing_eligible === 'true';
  const includeCustomerId = req.query.include_customer_id ? parseInt(req.query.include_customer_id as string, 10) : null;
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
  const offset = (page - 1) * limit;

  const whereClauses: string[] = [];
  const params: any[] = [];

  if (query) {
    whereClauses.push('(c.customer_code LIKE ? OR c.full_name LIKE ? OR c.phone_number LIKE ?)');
    const wild = `%${query}%`;
    params.push(wild, wild, wild);
  }

  if (dispensingEligible) {
    if (includeCustomerId) {
      whereClauses.push(`(
        (c.id IN (SELECT customer_id FROM examinations)
         AND c.id NOT IN (
           SELECT customer_id FROM sales
           WHERE payment_status IN ('PARTIALLY_PAID', 'PAID')
             AND order_status NOT IN ('COLLECTED', 'CANCELLED')
         ))
        OR c.id = ?
      )`);
      params.push(includeCustomerId);
    } else {
      whereClauses.push(`(
        c.id IN (SELECT customer_id FROM examinations)
        AND c.id NOT IN (
          SELECT customer_id FROM sales
          WHERE payment_status IN ('PARTIALLY_PAID', 'PAID')
            AND order_status NOT IN ('COLLECTED', 'CANCELLED')
        )
      )`);
    }
  }

  const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';

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
    ${whereSql}
    GROUP BY c.id ORDER BY c.id DESC LIMIT ? OFFSET ?
  `;
  let countSql = `SELECT COUNT(*) as total FROM customers c ${whereSql}`;

  const queryParams = [...params, limit, offset];

  const [countRows] = await pool.query<RowDataPacket[]>(countSql, params);
  const total = countRows[0].total;

  const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams);

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

export async function getCustomerById(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);

  const [custRows] = await pool.query<RowDataPacket[]>('SELECT * FROM customers WHERE id = ?', [id]);
  if (custRows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
    return;
  }
  const customer = custRows[0];

  // Fetch chronological examinations with prescriptions
  const [examRows] = await pool.query<RowDataPacket[]>(
    `SELECT e.id as exam_id, e.exam_date, e.clinical_notes, e.created_at as exam_created_at,
            u.full_name as examiner_name,
            p.id as prescription_id, p.od_sph, p.od_cyl, p.od_axis, p.od_add,
            p.os_sph, p.os_cyl, p.os_axis, p.os_add, p.pd, p.is_latest
     FROM examinations e
     LEFT JOIN prescriptions p ON p.examination_id = e.id
     LEFT JOIN users u ON u.id = e.examiner_id
     WHERE e.customer_id = ?
     ORDER BY e.exam_date DESC, e.id DESC`,
    [id]
  );

  // Fetch sales and purchase history
  const [saleRows] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.sale_number, s.total_amount, s.paid_amount, s.balance_amount,
            s.payment_status, s.order_status, s.order_type, s.created_at
     FROM sales s
     WHERE s.customer_id = ?
     ORDER BY s.id DESC`,
    [id]
  );

  // Fetch communication history
  const [commRows] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.comm_type, c.channel, c.recipient_contact, c.subject, c.message_body,
            c.status, c.dispatched_at, c.created_at, u.full_name as approved_by_name
     FROM communications c
     LEFT JOIN users u ON u.id = c.approved_by_user_id
     WHERE c.customer_id = ?
     ORDER BY c.id DESC`,
    [id]
  );

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

  // Fetch profile evolution & demographic history
  const [historyRows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM customer_profile_history WHERE customer_id = ? ORDER BY id DESC',
    [id]
  );

  res.json({
    success: true,
    data: {
      customer,
      examinations: formattedExams,
      sales: saleRows,
      communications: commRows,
      profile_history: historyRows,
    }
  });
}

export async function checkDuplicateCustomer(req: Request, res: Response): Promise<void> {
  const rawPhone = (req.query.phone as string || '').trim().replace(/[\s\-()]/g, '');
  const rawName = (req.query.name as string || '').trim();

  if (!rawPhone && !rawName) {
    res.json({ success: true, data: { exists: false, customer: null } });
    return;
  }

  const phoneMatch = rawPhone ? `%${rawPhone}%` : '___NO_PHONE___';
  const nameMatch = rawName || '___NO_NAME___';

  const sql = `
    SELECT c.*,
           COUNT(DISTINCT e.id) as exam_count,
           MAX(e.exam_date) as latest_exam_date,
           MAX(e.created_at) as latest_exam_created_at,
           COUNT(DISTINCT s.id) as sales_count
    FROM customers c
    LEFT JOIN examinations e ON e.customer_id = c.id
    LEFT JOIN sales s ON s.customer_id = c.id
    WHERE (REPLACE(REPLACE(REPLACE(c.phone_number, ' ', ''), '-', ''), '(', '') LIKE ?
           OR LOWER(c.full_name) = LOWER(?))
    GROUP BY c.id
    ORDER BY c.id DESC
    LIMIT 1
  `;

  const [rows] = await pool.query<RowDataPacket[]>(sql, [phoneMatch, nameMatch]);

  if (rows.length === 0) {
    res.json({ success: true, data: { exists: false, customer: null } });
    return;
  }

  const found = rows[0];
  res.json({
    success: true,
    data: {
      exists: true,
      customer: found,
      stats: {
        exam_count: Number(found.exam_count || 0),
        latest_exam_date: found.latest_exam_date,
        sales_count: Number(found.sales_count || 0),
      }
    }
  });
}

export async function createCustomer(req: Request, res: Response): Promise<void> {
  const data = customerSchema.parse(req.body);

  // Auto-generate Customer Code: CUST-YYYY-XXXX
  const currentYear = new Date().getFullYear();
  const [countResult] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) as cnt FROM customers WHERE customer_code LIKE ?',
    [`CUST-${currentYear}-%`]
  );
  const nextSeq = (countResult[0].cnt + 1).toString().padStart(4, '0');
  const customerCode = `CUST-${currentYear}-${nextSeq}`;

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO customers (customer_code, full_name, phone_number, email, address, age, gender, occupation, preferences_notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customerCode,
      data.full_name,
      data.phone_number,
      data.email || null,
      data.address || null,
      data.age || null,
      data.gender || null,
      data.occupation || null,
      data.preferences_notes || null,
    ]
  );

  if (req.user) {
    await logAuditEvent(req.user.id, 'CREATE_CUSTOMER', 'CUSTOMER', result.insertId, { customerCode, name: data.full_name }, req);
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

export async function updateCustomer(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);
  const data = customerSchema.parse(req.body);

  const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM customers WHERE id = ?', [id]);
  if (existing.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
    return;
  }
  const old = existing[0];

  // Check if any demographic, contact, or lifestyle attributes have changed
  const hasChanged =
    old.full_name !== data.full_name ||
    old.phone_number !== data.phone_number ||
    (old.email || null) !== (data.email || null) ||
    (old.address || null) !== (data.address || null) ||
    (old.age ? Number(old.age) : null) !== (data.age ? Number(data.age) : null) ||
    old.gender !== data.gender ||
    (old.occupation || null) !== (data.occupation || null) ||
    (old.preferences_notes || null) !== (data.preferences_notes || null);

  // If changed, archive historical snapshot into customer_profile_history
  if (hasChanged) {
    await pool.query(
      `INSERT INTO customer_profile_history
       (customer_id, changed_by_user_id, changed_by_name,
        previous_full_name, previous_phone_number, previous_email,
        previous_address, previous_age, previous_gender,
        previous_occupation, previous_preferences_notes, change_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user?.id || null,
        req.user?.fullName || 'Staff',
        old.full_name,
        old.phone_number,
        old.email,
        old.address,
        old.age,
        old.gender,
        old.occupation,
        old.preferences_notes,
        req.body.change_reason || 'Returning patient profile update'
      ]
    );
  }

  await pool.query(
    `UPDATE customers
     SET full_name = ?, phone_number = ?, email = ?, address = ?, age = ?, gender = ?, occupation = ?, preferences_notes = ?
     WHERE id = ?`,
    [
      data.full_name,
      data.phone_number,
      data.email || null,
      data.address || null,
      data.age || null,
      data.gender || null,
      data.occupation || null,
      data.preferences_notes || null,
      id
    ]
  );

  if (req.user) {
    await logAuditEvent(req.user.id, 'UPDATE_CUSTOMER', 'CUSTOMER', id, { name: data.full_name, archivedHistory: hasChanged }, req);
  }

  res.json({
    success: true,
    data: { id, ...data, archivedHistory: hasChanged }
  });
}

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid customer ID.' } });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id, customer_code, full_name FROM customers WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Customer not found.' } });
      return;
    }

    const customer = existing[0];

    // 1. Delete associated payments for this customer's sales
    await connection.query(
      'DELETE FROM payments WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = ?)',
      [id]
    );

    // 2. Unlink inventory movements referencing this customer's sales
    await connection.query(
      'UPDATE inventory_movements SET reference_sale_id = NULL WHERE reference_sale_id IN (SELECT id FROM sales WHERE customer_id = ?)',
      [id]
    );

    // 3. Delete sale items
    await connection.query(
      'DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE customer_id = ?)',
      [id]
    );

    // 4. Delete communications
    await connection.query(
      'DELETE FROM communications WHERE customer_id = ?',
      [id]
    );

    // 5. Delete sales
    await connection.query(
      'DELETE FROM sales WHERE customer_id = ?',
      [id]
    );

    // 6. Delete prescriptions
    await connection.query(
      'DELETE FROM prescriptions WHERE customer_id = ?',
      [id]
    );

    // 7. Delete examinations
    await connection.query(
      'DELETE FROM examinations WHERE customer_id = ?',
      [id]
    );

    // 8. Delete customer record
    await connection.query(
      'DELETE FROM customers WHERE id = ?',
      [id]
    );

    await connection.commit();

    if (req.user) {
      await logAuditEvent(
        req.user.id,
        'DELETE_CUSTOMER',
        'CUSTOMER',
        id,
        { customer_code: customer.customer_code, full_name: customer.full_name },
        req
      );
    }

    res.json({
      success: true,
      message: `Customer ${customer.full_name} (${customer.customer_code}) and all related clinical records deleted successfully.`
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to delete customer record.' }
    });
  } finally {
    connection.release();
  }
}
