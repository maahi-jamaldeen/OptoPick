import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { stockInSchema } from '../validation/salesAndStockSchemas.js';
import { logAuditEvent } from '../utils/security.js';

export async function getInventoryStatus(req: Request, res: Response): Promise<void> {
  const filter = req.query.status as string; // 'LOW_STOCK', 'OUT_OF_STOCK', 'ALL'

  // Query unified frames, lenses, accessories with supplier details
  const [frames] = await pool.query<RowDataPacket[]>(
    `SELECT 'FRAME' as product_type, 'FRAME' as item_type, f.id,
            f.frame_code as code, f.frame_code as item_code,
            CONCAT(f.brand, ' ', f.model_name, ' (', f.color, ' ', f.size, ')') as name,
            CONCAT(f.brand, ' ', f.model_name, ' (', f.color, ' ', f.size, ')') as item_name,
            f.stock_quantity, f.low_stock_threshold, f.selling_price,
            f.supplier_id, s.name as supplier_name,
            f.created_at, f.updated_at,
            CASE
              WHEN f.stock_quantity = 0 THEN 'OUT_OF_STOCK'
              WHEN f.stock_quantity <= f.low_stock_threshold THEN 'LOW_STOCK'
              ELSE 'IN_STOCK'
            END as status
     FROM frames f
     LEFT JOIN suppliers s ON s.id = f.supplier_id
     WHERE f.is_active = 1`
  );

  const [lenses] = await pool.query<RowDataPacket[]>(
    `SELECT 'LENS' as product_type, 'LENS' as item_type, l.id,
            l.lens_code as code, l.lens_code as item_code,
            CONCAT(l.brand, ' ', REPLACE(l.design_type, '_', ' '), ' ', l.material, ' (Index ', l.refractive_index, ')') as name,
            CONCAT(l.brand, ' ', REPLACE(l.design_type, '_', ' '), ' ', l.material, ' (Index ', l.refractive_index, ')') as item_name,
            l.stock_quantity, l.low_stock_threshold, l.selling_price,
            l.supplier_id, s.name as supplier_name,
            l.created_at, l.updated_at,
            CASE
              WHEN l.stock_quantity = 0 THEN 'OUT_OF_STOCK'
              WHEN l.stock_quantity <= l.low_stock_threshold THEN 'LOW_STOCK'
              ELSE 'IN_STOCK'
            END as status
     FROM lenses l
     LEFT JOIN suppliers s ON s.id = l.supplier_id
     WHERE l.is_available = 1`
  );

  const [accessories] = await pool.query<RowDataPacket[]>(
    `SELECT 'ACCESSORY' as product_type, 'ACCESSORY' as item_type, a.id,
            a.item_code as code, a.item_code,
            a.name, a.name as item_name,
            a.stock_quantity, a.low_stock_threshold, a.selling_price,
            a.supplier_id, s.name as supplier_name,
            a.created_at, a.updated_at,
            CASE
              WHEN a.stock_quantity = 0 THEN 'OUT_OF_STOCK'
              WHEN a.stock_quantity <= a.low_stock_threshold THEN 'LOW_STOCK'
              ELSE 'IN_STOCK'
            END as status
     FROM accessories a
     LEFT JOIN suppliers s ON s.id = a.supplier_id
     WHERE a.is_active = 1`
  );

  const allItems = [...frames, ...lenses, ...accessories];
  const totalItems = allItems.length;
  const lowStockCount = allItems.filter(i => i.status === 'LOW_STOCK').length;
  const outOfStockCount = allItems.filter(i => i.status === 'OUT_OF_STOCK').length;

  let combined = allItems;
  if (filter === 'LOW_STOCK') {
    combined = combined.filter(item => item.status === 'LOW_STOCK');
  } else if (filter === 'OUT_OF_STOCK') {
    combined = combined.filter(item => item.status === 'OUT_OF_STOCK');
  } else if (filter === 'ATTENTION') {
    combined = combined.filter(item => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK');
  }

  res.json({
    success: true,
    data: {
      items: combined,
      summary: {
        totalItems,
        lowStockCount,
        outOfStockCount,
      }
    }
  });
}

export async function recordStockIn(req: Request, res: Response): Promise<void> {
  const data = stockInSchema.parse(req.body);
  const userId = req.user!.id;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    let table = '';
    if (data.product_type === 'FRAME') table = 'frames';
    else if (data.product_type === 'LENS') table = 'lenses';
    else if (data.product_type === 'ACCESSORY') table = 'accessories';

    // Get current stock
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT id, stock_quantity FROM ${table} WHERE id = ? FOR UPDATE`,
      [data.product_id]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Target product not found.' } });
      await connection.rollback();
      return;
    }

    const prevQty = rows[0].stock_quantity;
    const newQty = prevQty + data.quantity;

    // Update stock quantity
    await connection.query(
      `UPDATE ${table} SET stock_quantity = ? WHERE id = ?`,
      [newQty, data.product_id]
    );

    // Lookup supplier name if not provided
    let supplierName = data.supplier_name;
    if (!supplierName) {
      const [suppRows] = await connection.query<RowDataPacket[]>(
        `SELECT s.name as supplier_name
         FROM ${table} t
         LEFT JOIN suppliers s ON s.id = t.supplier_id
         WHERE t.id = ?`,
        [data.product_id]
      );
      if (suppRows.length > 0 && suppRows[0].supplier_name) {
        supplierName = suppRows[0].supplier_name;
      }
    }

    // Record movement with procurement financials
    await connection.query(
      `INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, user_id, notes, unit_cost, supplier_ref, supplier_name)
       VALUES (?, ?, 'STOCK_IN', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.product_type,
        data.product_id,
        data.quantity,
        prevQty,
        newQty,
        userId,
        data.notes || 'Supplier replenishment',
        data.unit_cost || null,
        data.supplier_reference || null,
        supplierName || null,
      ]
    );

    await connection.commit();

    await logAuditEvent(userId, 'STOCK_IN', data.product_type, data.product_id, {
      received: data.quantity,
      previousQuantity: prevQty,
      newQuantity: newQty,
      unitCost: data.unit_cost,
      supplierRef: data.supplier_reference,
    }, req);

    res.json({
      success: true,
      data: {
        productType: data.product_type,
        productId: data.product_id,
        quantityAdded: data.quantity,
        previousQuantity: prevQty,
        newQuantity: newQty,
      }
    });

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function getMovements(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
  const offset = (page - 1) * limit;

  const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM inventory_movements');
  const total = countRows[0].total;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.*,
            ABS(m.quantity_change) as quantity,
            COALESCE(m.notes, 'Inventory Adjustment') as reason,
            u.full_name as recorded_by,
            u.full_name as created_by_name,
            s.sale_number,
            CASE
              WHEN m.product_type = 'FRAME' THEN (SELECT CONCAT(f.frame_code, ' - ', f.brand, ' ', f.model_name) FROM frames f WHERE f.id = m.product_id)
              WHEN m.product_type = 'LENS' THEN (SELECT CONCAT(l.lens_code, ' - ', l.brand, ' ', l.material, ' (Index ', l.refractive_index, ')') FROM lenses l WHERE l.id = m.product_id)
              WHEN m.product_type = 'ACCESSORY' THEN (SELECT CONCAT(a.item_code, ' - ', a.name) FROM accessories a WHERE a.id = m.product_id)
              ELSE CONCAT(m.product_type, ' #', m.product_id)
            END as item_name,
            CASE
              WHEN m.product_type = 'FRAME' THEN (SELECT f.frame_code FROM frames f WHERE f.id = m.product_id)
              WHEN m.product_type = 'LENS' THEN (SELECT l.lens_code FROM lenses l WHERE l.id = m.product_id)
              WHEN m.product_type = 'ACCESSORY' THEN (SELECT a.item_code FROM accessories a WHERE a.id = m.product_id)
              ELSE ''
            END as item_code
     FROM inventory_movements m
     LEFT JOIN users u ON u.id = m.user_id
     LEFT JOIN sales s ON s.id = m.reference_sale_id
     ORDER BY m.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  // If user is not admin, hide financial procurement costs
  const isAdmin = req.user?.role === 'ADMIN';
  const sanitizedRows = rows.map((r) => {
    if (!isAdmin) {
      return {
        ...r,
        unit_cost: null,
      };
    }
    return r;
  });

  res.json({
    success: true,
    data: {
      movements: sanitizedRows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }
  });
}

export async function getGoodsReceipts(req: Request, res: Response): Promise<void> {
  const isAdmin = req.user?.role === 'ADMIN';

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT m.id,
            m.product_type,
            m.product_id,
            m.movement_type,
            ABS(m.quantity_change) as quantity_received,
            m.previous_quantity,
            m.new_quantity,
            COALESCE(m.unit_cost, 0) as unit_cost,
            (ABS(m.quantity_change) * COALESCE(m.unit_cost, 0)) as total_cost,
            COALESCE(m.supplier_ref, 'DIRECT_RECEIPT') as invoice_ref,
            COALESCE(m.supplier_name, s_prod.name, 'Direct Vendor') as supplier_name,
            m.notes,
            m.created_at,
            u.full_name as recorded_by,
            CASE
              WHEN m.product_type = 'FRAME' THEN (SELECT CONCAT(f.brand, ' — ', f.model_name) FROM frames f WHERE f.id = m.product_id)
              WHEN m.product_type = 'LENS' THEN (SELECT CONCAT(l.brand, ' (', l.design_type, ')') FROM lenses l WHERE l.id = m.product_id)
              WHEN m.product_type = 'ACCESSORY' THEN (SELECT a.name FROM accessories a WHERE a.id = m.product_id)
              ELSE CONCAT(m.product_type, ' #', m.product_id)
            END as item_name,
            CASE
              WHEN m.product_type = 'FRAME' THEN (SELECT f.frame_code FROM frames f WHERE f.id = m.product_id)
              WHEN m.product_type = 'LENS' THEN (SELECT l.lens_code FROM lenses l WHERE l.id = m.product_id)
              WHEN m.product_type = 'ACCESSORY' THEN (SELECT a.item_code FROM accessories a WHERE a.id = m.product_id)
              ELSE ''
            END as item_code,
            CASE
              WHEN m.product_type = 'FRAME' THEN (SELECT f.selling_price FROM frames f WHERE f.id = m.product_id)
              WHEN m.product_type = 'LENS' THEN (SELECT l.selling_price FROM lenses l WHERE l.id = m.product_id)
              WHEN m.product_type = 'ACCESSORY' THEN (SELECT a.selling_price FROM accessories a WHERE a.id = m.product_id)
              ELSE 0
            END as retail_price
     FROM inventory_movements m
     LEFT JOIN users u ON u.id = m.user_id
     LEFT JOIN frames f_prod ON m.product_type = 'FRAME' AND f_prod.id = m.product_id
     LEFT JOIN lenses l_prod ON m.product_type = 'LENS' AND l_prod.id = m.product_id
     LEFT JOIN accessories a_prod ON m.product_type = 'ACCESSORY' AND a_prod.id = m.product_id
     LEFT JOIN suppliers s_prod ON s_prod.id = COALESCE(f_prod.supplier_id, l_prod.supplier_id, a_prod.supplier_id)
     WHERE m.movement_type = 'STOCK_IN'
     ORDER BY m.id DESC`
  );

  let totalSpend = 0;
  let totalUnits = 0;
  const sanitizedReceipts = rows.map((r) => {
    totalUnits += Number(r.quantity_received || 0);
    if (!isAdmin) {
      return {
        ...r,
        unit_cost: null,
        total_cost: null,
      };
    }
    totalSpend += Number(r.total_cost || 0);
    return r;
  });

  res.json({
    success: true,
    data: {
      receipts: sanitizedReceipts,
      summary: {
        totalSpend: isAdmin ? totalSpend : 0,
        totalUnits,
        totalShipments: rows.length,
      }
    }
  });
}
