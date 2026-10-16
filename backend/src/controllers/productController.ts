import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { frameSchema, lensSchema, accessorySchema } from '../validation/salesAndStockSchemas.js';
import { logAuditEvent } from '../utils/security.js';

// --- FRAMES ---
export async function getFrames(req: Request, res: Response): Promise<void> {
  const brand = req.query.brand as string;
  const shape = req.query.shape as string;
  const inStockOnly = req.query.inStock === 'true';

  let sql = `SELECT f.*, s.name as supplier_name
             FROM frames f
             LEFT JOIN suppliers s ON s.id = f.supplier_id
             WHERE f.is_active = 1`;
  const params: any[] = [];

  if (brand) {
    sql += ' AND f.brand = ?';
    params.push(brand);
  }
  if (shape) {
    sql += ' AND f.shape = ?';
    params.push(shape);
  }
  if (inStockOnly) {
    sql += ' AND f.stock_quantity > 0';
  }

  sql += ' ORDER BY f.brand ASC, f.model_name ASC';

  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  res.json({ success: true, data: { frames: rows } });
}

export async function createFrame(req: Request, res: Response): Promise<void> {
  const data = frameSchema.parse(req.body);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO frames (frame_code, brand, model_name, shape, color, material, size, selling_price, supplier_id, stock_quantity, low_stock_threshold, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      data.frame_code,
      data.brand,
      data.model_name,
      data.shape,
      data.color,
      data.material,
      data.size,
      data.selling_price,
      data.supplier_id,
      data.stock_quantity,
      data.low_stock_threshold,
    ]
  );

  // If initial stock > 0, record initial stock movement
  if (data.stock_quantity > 0) {
    await pool.query(
      `INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, user_id, notes)
       VALUES ('FRAME', ?, 'STOCK_IN', ?, 0, ?, ?, 'Initial inventory addition')`,
      [result.insertId, data.stock_quantity, data.stock_quantity, req.user!.id]
    );
  }

  await logAuditEvent(req.user!.id, 'CREATE_FRAME', 'FRAME', result.insertId, { code: data.frame_code }, req);

  res.status(201).json({
    success: true,
    data: { id: result.insertId, ...data }
  });
}

// --- LENSES ---
export async function getLenses(req: Request, res: Response): Promise<void> {
  const design = req.query.design as string;
  const inStockOnly = req.query.inStock === 'true';

  let sql = `SELECT l.*, s.name as supplier_name
             FROM lenses l
             LEFT JOIN suppliers s ON s.id = l.supplier_id
             WHERE l.is_available = 1`;
  const params: any[] = [];

  if (design) {
    sql += ' AND l.design_type = ?';
    params.push(design);
  }
  if (inStockOnly) {
    sql += ' AND l.stock_quantity > 0';
  }

  sql += ' ORDER BY l.refractive_index ASC, l.selling_price ASC';

  const [rows] = await pool.query<RowDataPacket[]>(sql, params);
  res.json({ success: true, data: { lenses: rows } });
}

export async function createLens(req: Request, res: Response): Promise<void> {
  const data = lensSchema.parse(req.body);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO lenses
     (lens_code, brand, design_type, material, refractive_index, coatings, min_sph, max_sph, min_cyl, max_cyl, min_add, max_add, selling_price, supplier_id, stock_quantity, low_stock_threshold, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      data.lens_code,
      data.brand,
      data.design_type,
      data.material,
      data.refractive_index,
      data.coatings,
      data.min_sph,
      data.max_sph,
      data.min_cyl,
      data.max_cyl,
      data.min_add || null,
      data.max_add || null,
      data.selling_price,
      data.supplier_id,
      data.stock_quantity,
      data.low_stock_threshold,
    ]
  );

  if (data.stock_quantity > 0) {
    await pool.query(
      `INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, user_id, notes)
       VALUES ('LENS', ?, 'STOCK_IN', ?, 0, ?, ?, 'Initial inventory addition')`,
      [result.insertId, data.stock_quantity, data.stock_quantity, req.user!.id]
    );
  }

  await logAuditEvent(req.user!.id, 'CREATE_LENS', 'LENS', result.insertId, { code: data.lens_code }, req);

  res.status(201).json({
    success: true,
    data: { id: result.insertId, ...data }
  });
}

// --- ACCESSORIES ---
export async function getAccessories(req: Request, res: Response): Promise<void> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT a.*, s.name as supplier_name
     FROM accessories a
     LEFT JOIN suppliers s ON s.id = a.supplier_id
     WHERE a.is_active = 1
     ORDER BY a.name ASC`
  );

  res.json({ success: true, data: { accessories: rows } });
}

export async function createAccessory(req: Request, res: Response): Promise<void> {
  const data = accessorySchema.parse(req.body);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO accessories (item_code, name, selling_price, supplier_id, stock_quantity, low_stock_threshold, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      data.item_code,
      data.name,
      data.selling_price,
      data.supplier_id,
      data.stock_quantity,
      data.low_stock_threshold,
    ]
  );

  if (data.stock_quantity > 0) {
    await pool.query(
      `INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, user_id, notes)
       VALUES ('ACCESSORY', ?, 'STOCK_IN', ?, 0, ?, ?, 'Initial inventory addition')`,
      [result.insertId, data.stock_quantity, data.stock_quantity, req.user!.id]
    );
  }

  await logAuditEvent(req.user!.id, 'CREATE_ACCESSORY', 'ACCESSORY', result.insertId, { code: data.item_code }, req);

  res.status(201).json({
    success: true,
    data: { id: result.insertId, ...data }
  });
}

export async function updateFrame(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const data = frameSchema.partial().parse(req.body);

  const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM frames WHERE id = ?', [id]);
  if (existing.length === 0) {
    res.status(404).json({ success: false, error: { message: 'Frame not found.' } });
    return;
  }

  await pool.query(
    `UPDATE frames
     SET frame_code = COALESCE(?, frame_code),
         brand = COALESCE(?, brand),
         model_name = COALESCE(?, model_name),
         shape = COALESCE(?, shape),
         color = COALESCE(?, color),
         material = COALESCE(?, material),
         size = COALESCE(?, size),
         selling_price = COALESCE(?, selling_price),
         supplier_id = COALESCE(?, supplier_id),
         stock_quantity = COALESCE(?, stock_quantity),
         low_stock_threshold = COALESCE(?, low_stock_threshold)
     WHERE id = ?`,
    [
      data.frame_code,
      data.brand,
      data.model_name,
      data.shape,
      data.color,
      data.material,
      data.size,
      data.selling_price,
      data.supplier_id,
      data.stock_quantity,
      data.low_stock_threshold,
      id
    ]
  );

  await logAuditEvent(req.user!.id, 'UPDATE_FRAME', 'FRAME', id, data, req);

  res.json({ success: true, data: { id, ...data } });
}

export async function updateLens(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const data = lensSchema.partial().parse(req.body);

  const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM lenses WHERE id = ?', [id]);
  if (existing.length === 0) {
    res.status(404).json({ success: false, error: { message: 'Lens not found.' } });
    return;
  }

  await pool.query(
    `UPDATE lenses
     SET lens_code = COALESCE(?, lens_code),
         brand = COALESCE(?, brand),
         design_type = COALESCE(?, design_type),
         material = COALESCE(?, material),
         refractive_index = COALESCE(?, refractive_index),
         coatings = COALESCE(?, coatings),
         min_sph = COALESCE(?, min_sph),
         max_sph = COALESCE(?, max_sph),
         min_cyl = COALESCE(?, min_cyl),
         max_cyl = COALESCE(?, max_cyl),
         selling_price = COALESCE(?, selling_price),
         supplier_id = COALESCE(?, supplier_id),
         stock_quantity = COALESCE(?, stock_quantity),
         low_stock_threshold = COALESCE(?, low_stock_threshold)
     WHERE id = ?`,
    [
      data.lens_code,
      data.brand,
      data.design_type,
      data.material,
      data.refractive_index,
      data.coatings,
      data.min_sph,
      data.max_sph,
      data.min_cyl,
      data.max_cyl,
      data.selling_price,
      data.supplier_id,
      data.stock_quantity,
      data.low_stock_threshold,
      id
    ]
  );

  await logAuditEvent(req.user!.id, 'UPDATE_LENS', 'LENS', id, data, req);

  res.json({ success: true, data: { id, ...data } });
}

export async function updateAccessory(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const data = accessorySchema.partial().parse(req.body);

  const [existing] = await pool.query<RowDataPacket[]>('SELECT * FROM accessories WHERE id = ?', [id]);
  if (existing.length === 0) {
    res.status(404).json({ success: false, error: { message: 'Accessory not found.' } });
    return;
  }

  await pool.query(
    `UPDATE accessories
     SET item_code = COALESCE(?, item_code),
         name = COALESCE(?, name),
         selling_price = COALESCE(?, selling_price),
         supplier_id = COALESCE(?, supplier_id),
         stock_quantity = COALESCE(?, stock_quantity),
         low_stock_threshold = COALESCE(?, low_stock_threshold)
     WHERE id = ?`,
    [
      data.item_code,
      data.name,
      data.selling_price,
      data.supplier_id,
      data.stock_quantity,
      data.low_stock_threshold,
      id
    ]
  );

  await logAuditEvent(req.user!.id, 'UPDATE_ACCESSORY', 'ACCESSORY', id, data, req);

  res.json({ success: true, data: { id, ...data } });
}
