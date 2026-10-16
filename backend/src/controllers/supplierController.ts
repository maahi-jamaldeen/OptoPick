import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { z } from 'zod';
import { logAuditEvent } from '../utils/security.js';

const supplierSchema = z.object({
  supplier_code: z.string().min(2).max(20),
  name: z.string().min(2).max(100),
  contact_person: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  credit_terms: z.string().max(100).optional().or(z.literal('')),
  settlement_method: z.string().max(100).optional().or(z.literal('')),
  lead_time: z.string().max(100).optional().or(z.literal('')),
  warranty_terms: z.string().max(255).optional().or(z.literal('')),
});

export async function getSuppliers(req: Request, res: Response): Promise<void> {
  const showAll = req.query.all === 'true';
  const sql = showAll
    ? 'SELECT * FROM suppliers ORDER BY is_active DESC, name ASC'
    : 'SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name ASC';
  const [rows] = await pool.query<RowDataPacket[]>(sql);

  res.json({ success: true, data: { suppliers: rows } });
}

export async function createSupplier(req: Request, res: Response): Promise<void> {
  const data = supplierSchema.parse(req.body);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO suppliers (supplier_code, name, contact_person, phone, email, address, credit_terms, settlement_method, lead_time, warranty_terms, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      data.supplier_code,
      data.name,
      data.contact_person || null,
      data.phone,
      data.email || null,
      data.address || null,
      data.credit_terms || 'Net 30 Days credit settlement from date of physical Goods Receipt at Nintavur',
      data.settlement_method || 'Direct Electronic Bank Transfer (Commercial Bank / HNB Sri Lanka)',
      data.lead_time || '2 to 3 Business Days via standard courier delivery to Indian Optician',
      data.warranty_terms || '12 months frame hinge warranty; 6 months hard multi-coating guarantee on lenses',
    ]
  );

  await logAuditEvent(req.user!.id, 'CREATE_SUPPLIER', 'SUPPLIER', result.insertId, { name: data.name }, req);

  res.status(201).json({
    success: true,
    data: { id: result.insertId, ...data }
  });
}

export async function updateSupplier(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const data = supplierSchema.partial().extend({ is_active: z.coerce.number().optional() }).parse(req.body);

  const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM suppliers WHERE id = ?', [id]);
  if (existing.length === 0) {
    res.status(404).json({ success: false, error: { message: 'Supplier not found.' } });
    return;
  }

  await pool.query(
    `UPDATE suppliers
     SET supplier_code = COALESCE(?, supplier_code),
         name = COALESCE(?, name),
         contact_person = COALESCE(?, contact_person),
         phone = COALESCE(?, phone),
         email = COALESCE(?, email),
         address = COALESCE(?, address),
         credit_terms = COALESCE(?, credit_terms),
         settlement_method = COALESCE(?, settlement_method),
         lead_time = COALESCE(?, lead_time),
         warranty_terms = COALESCE(?, warranty_terms),
         is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [
      data.supplier_code,
      data.name,
      data.contact_person,
      data.phone,
      data.email,
      data.address,
      data.credit_terms,
      data.settlement_method,
      data.lead_time,
      data.warranty_terms,
      data.is_active,
      id
    ]
  );

  await logAuditEvent(req.user!.id, 'UPDATE_SUPPLIER', 'SUPPLIER', id, data, req);

  res.json({ success: true, data: { id, ...data } });
}

export async function deleteSupplier(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  // Check if any products depend on this supplier
  const [frames] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM frames WHERE supplier_id = ?', [id]);
  const [lenses] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM lenses WHERE supplier_id = ?', [id]);
  const [accessories] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM accessories WHERE supplier_id = ?', [id]);

  const totalLinked = (frames[0]?.cnt || 0) + (lenses[0]?.cnt || 0) + (accessories[0]?.cnt || 0);

  if (totalLinked > 0) {
    // Soft-deactivate to prevent foreign key constraint violation
    await pool.query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [id]);
    await logAuditEvent(req.user!.id, 'DEACTIVATE_SUPPLIER', 'SUPPLIER', id, { reason: 'Has linked products' }, req);
    res.json({
      success: true,
      data: {
        id,
        action: 'DEACTIVATED',
        message: `Supplier has ${totalLinked} linked product(s). Deactivated successfully to preserve inventory audit history.`
      }
    });
    return;
  }

  await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
  await logAuditEvent(req.user!.id, 'DELETE_SUPPLIER', 'SUPPLIER', id, null, req);

  res.json({
    success: true,
    data: { id, action: 'DELETED', message: 'Supplier deleted permanently.' }
  });
}
