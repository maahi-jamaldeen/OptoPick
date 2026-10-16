import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { prescriptionSchema } from '../validation/clinicalSchemas.js';
import { logAuditEvent } from '../utils/security.js';

export async function createExamination(req: Request, res: Response): Promise<void> {
  const data = prescriptionSchema.parse(req.body);
  const examinerId = req.user!.id;

  // Verify customer exists
  const [custRows] = await pool.query<RowDataPacket[]>('SELECT id, full_name FROM customers WHERE id = ?', [data.customer_id]);
  if (custRows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer does not exist.' } });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insert examination record
    const [examResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO examinations (customer_id, examiner_id, exam_date, clinical_notes)
       VALUES (?, ?, ?, ?)`,
      [data.customer_id, examinerId, data.exam_date, data.clinical_notes || null]
    );
    const examId = examResult.insertId;

    // 2. Mark previous prescriptions as not latest
    await connection.query(
      'UPDATE prescriptions SET is_latest = 0 WHERE customer_id = ?',
      [data.customer_id]
    );

    // 3. Insert new prescription record
    const [rxResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO prescriptions
       (examination_id, customer_id, od_sph, od_cyl, od_axis, od_add, os_sph, os_cyl, os_axis, os_add, pd, is_latest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
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
      ]
    );

    await connection.commit();

    await logAuditEvent(
      examinerId,
      'RECORD_EXAMINATION',
      'EXAMINATION',
      examId,
      { customerId: data.customer_id, prescriptionId: rxResult.insertId },
      req
    );

    res.status(201).json({
      success: true,
      data: {
        examination_id: examId,
        prescription_id: rxResult.insertId,
        ...data,
      }
    });

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function getPrescriptionHistory(req: Request, res: Response): Promise<void> {
  const customerId = parseInt(String(req.params.customerId), 10);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT e.id as exam_id, e.exam_date, e.clinical_notes, e.created_at as recorded_at,
            u.full_name as examiner_name,
            p.id as prescription_id, p.od_sph, p.od_cyl, p.od_axis, p.od_add,
            p.os_sph, p.os_cyl, p.os_axis, p.os_add, p.pd, p.is_latest
     FROM examinations e
     JOIN prescriptions p ON p.examination_id = e.id
     JOIN users u ON u.id = e.examiner_id
     WHERE e.customer_id = ?
     ORDER BY e.exam_date DESC, e.id DESC`,
    [customerId]
  );

  res.json({
    success: true,
    data: { history: rows }
  });
}

export async function getLatestPrescription(req: Request, res: Response): Promise<void> {
  const customerId = parseInt(String(req.params.customerId), 10);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.*, e.exam_date, e.clinical_notes, u.full_name as examiner_name
     FROM prescriptions p
     JOIN examinations e ON e.id = p.examination_id
     JOIN users u ON u.id = e.examiner_id
     WHERE p.customer_id = ? AND p.is_latest = 1
     LIMIT 1`,
    [customerId]
  );

  if (rows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NO_PRESCRIPTION', message: 'No active prescription found for this customer.' } });
    return;
  }

  res.json({
    success: true,
    data: { prescription: rows[0] }
  });
}
