import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { createSaleSchema, addPaymentSchema } from '../validation/salesAndStockSchemas.js';
import { logAuditEvent } from '../utils/security.js';

export async function createSale(req: Request, res: Response): Promise<void> {
  const data = createSaleSchema.parse(req.body);
  const userId = req.user!.id;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Validate customer
    const [custRows] = await connection.query<RowDataPacket[]>('SELECT id, full_name, phone_number, email FROM customers WHERE id = ?', [data.customer_id]);
    if (custRows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found.' } });
      await connection.rollback();
      return;
    }
    const customer = custRows[0];

    // 2. Validate prescription if provided
    if (data.prescription_id) {
      const [rxRows] = await connection.query<RowDataPacket[]>('SELECT id FROM prescriptions WHERE id = ? AND customer_id = ?', [data.prescription_id, data.customer_id]);
      if (rxRows.length === 0) {
        res.status(400).json({ success: false, error: { code: 'INVALID_PRESCRIPTION', message: 'Prescription does not belong to this customer.' } });
        await connection.rollback();
        return;
      }
    }

    // 3. Validate stock availability and calculate subtotal
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      item_type: 'FRAME' | 'LENS' | 'ACCESSORY';
      product_id: number;
      quantity: number;
      unit_price: number;
      total_price: number;
      product_name: string;
      current_stock: number;
    }> = [];

    for (const item of data.items) {
      let table = '';
      let codeCol = '';
      if (item.item_type === 'FRAME') { table = 'frames'; codeCol = 'frame_code'; }
      else if (item.item_type === 'LENS') { table = 'lenses'; codeCol = 'lens_code'; }
      else if (item.item_type === 'ACCESSORY') { table = 'accessories'; codeCol = 'item_code'; }

      const [pRows] = await connection.query<RowDataPacket[]>(
        `SELECT id, ${codeCol} as code, selling_price, stock_quantity FROM ${table} WHERE id = ? FOR UPDATE`,
        [item.product_id]
      );

      if (pRows.length === 0) {
        res.status(400).json({
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: `${item.item_type} ID ${item.product_id} does not exist.` }
        });
        await connection.rollback();
        return;
      }

      const product = pRows[0];
      if (product.stock_quantity < item.quantity) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock for ${item.item_type} (${product.code}). Available: ${product.stock_quantity}, Requested: ${item.quantity}.`
          }
        });
        await connection.rollback();
        return;
      }

      const itemTotal = Number(product.selling_price) * item.quantity;
      calculatedSubtotal += itemTotal;

      validatedItems.push({
        item_type: item.item_type,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: Number(product.selling_price),
        total_price: itemTotal,
        product_name: product.code,
        current_stock: product.stock_quantity,
      });
    }

    // 4. Financial Calculations in LKR (Strict decimal rounding & validation)
    const rawDiscount = Number(data.discount_amount);
    const rawPaid = Number(data.paid_amount);

    if (rawDiscount < 0 || rawPaid < 0) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_AMOUNT', message: 'Discount and payment amounts cannot be negative.' }
      });
      await connection.rollback();
      return;
    }

    if (rawDiscount > calculatedSubtotal) {
      res.status(400).json({
        success: false,
        error: { code: 'EXCESS_DISCOUNT', message: `Discount amount (LKR ${rawDiscount}) cannot exceed the subtotal of LKR ${calculatedSubtotal}.` }
      });
      await connection.rollback();
      return;
    }

    const discount = Math.min(calculatedSubtotal, Math.max(0, rawDiscount));
    const totalAmount = Math.max(0, calculatedSubtotal - discount);

    if (rawPaid > totalAmount) {
      res.status(400).json({
        success: false,
        error: { code: 'EXCESS_PAYMENT', message: `Advance payment (LKR ${rawPaid}) cannot exceed the net total payable amount of LKR ${totalAmount}.` }
      });
      await connection.rollback();
      return;
    }

    const paidAmount = Math.min(totalAmount, Math.max(0, rawPaid));
    const balanceAmount = totalAmount - paidAmount;

    let paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' = 'PENDING';
    if (paidAmount >= totalAmount) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    }

    let orderStatus: 'ORDER_PLACED' | 'DISPATCHED_TO_LAB' | 'RECEIVED_FROM_LAB' | 'READY_FOR_COLLECTION' | 'COLLECTED' = 'ORDER_PLACED';
    if (data.order_type === 'CUSTOM_FITTING_ORDER') {
      orderStatus = 'DISPATCHED_TO_LAB';
    } else {
      orderStatus = balanceAmount === 0 ? 'COLLECTED' : 'READY_FOR_COLLECTION';
    }

    // 5. Generate Sale Number: INV-YYYY-XXXX (Use MAX sequence + 1 to prevent collisions)
    const currentYear = new Date().getFullYear();
    const [maxResult] = await connection.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(sale_number, '-', -1) AS UNSIGNED)), 0) as max_seq
       FROM sales WHERE sale_number LIKE ? FOR UPDATE`,
      [`INV-${currentYear}-%`]
    );
    const saleSeq = ((maxResult[0].max_seq || 0) + 1).toString().padStart(4, '0');
    const saleNumber = `INV-${currentYear}-${saleSeq}`;

    // 6. Insert Sale
    const [saleResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO sales
       (sale_number, customer_id, prescription_id, user_id, subtotal, discount_amount, total_amount, paid_amount, balance_amount, payment_status, order_status, order_type, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleNumber,
        data.customer_id,
        data.prescription_id || null,
        userId,
        calculatedSubtotal,
        discount,
        totalAmount,
        paidAmount,
        balanceAmount,
        paymentStatus,
        orderStatus,
        data.order_type,
        data.notes || null,
      ]
    );
    const saleId = saleResult.insertId;

    // 7. Insert Sale Items & Deduct Inventory
    for (const vItem of validatedItems) {
      await connection.query(
        `INSERT INTO sale_items (sale_id, item_type, product_id, unit_price, quantity, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [saleId, vItem.item_type, vItem.product_id, vItem.unit_price, vItem.quantity, vItem.total_price]
      );

      let table = '';
      if (vItem.item_type === 'FRAME') table = 'frames';
      else if (vItem.item_type === 'LENS') table = 'lenses';
      else if (vItem.item_type === 'ACCESSORY') table = 'accessories';

      const newQty = vItem.current_stock - vItem.quantity;
      await connection.query(`UPDATE ${table} SET stock_quantity = ? WHERE id = ?`, [newQty, vItem.product_id]);

      await connection.query(
        `INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, reference_sale_id, user_id, notes)
         VALUES (?, ?, 'SALE_DEDUCTION', ?, ?, ?, ?, ?, ?)`,
        [vItem.item_type, vItem.product_id, -vItem.quantity, vItem.current_stock, newQty, saleId, userId, `Order reservation ${saleNumber}`]
      );
    }

    // 8. Insert Payment if paid_amount > 0
    if (paidAmount > 0) {
      const [payMax] = await connection.query<RowDataPacket[]>(
        `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(payment_number, '-', -1) AS UNSIGNED)), 0) as max_seq
         FROM payments WHERE payment_number LIKE ? FOR UPDATE`,
        [`PAY-${currentYear}-%`]
      );
      const paySeq = ((payMax[0].max_seq || 0) + 1).toString().padStart(4, '0');
      const payNumber = `PAY-${currentYear}-${paySeq}`;
      const payType = paidAmount >= totalAmount ? 'FULL' : 'ADVANCE';

      await connection.query(
        `INSERT INTO payments (payment_number, sale_id, amount, payment_method, payment_type, user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [payNumber, saleId, paidAmount, data.payment_method, payType, userId]
      );
    }

    await connection.commit();

    await logAuditEvent(userId, 'CREATE_SALE', 'SALE', saleId, { saleNumber, totalAmount, paidAmount }, req);

    res.status(201).json({
      success: true,
      data: {
        id: saleId,
        sale_number: saleNumber,
        customer_name: customer.full_name,
        subtotal: calculatedSubtotal,
        discount_amount: discount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        payment_status: paymentStatus,
        order_status: orderStatus,
        sale: {
          id: saleId,
          sale_number: saleNumber,
          customer_name: customer.full_name,
          subtotal: calculatedSubtotal,
          discount_amount: discount,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          balance_amount: balanceAmount,
          payment_status: paymentStatus,
          order_status: orderStatus,
        }
      }
    });

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function getSales(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
  const offset = (page - 1) * limit;
  const status = req.query.order_status as string;

  let sql = `SELECT s.*, c.full_name as customer_name, c.phone_number, u.full_name as staff_name
             FROM sales s
             JOIN customers c ON c.id = s.customer_id
             JOIN users u ON u.id = s.user_id`;
  let countSql = 'SELECT COUNT(*) as total FROM sales s';
  const params: any[] = [];

  if (status) {
    sql += ' WHERE s.order_status = ?';
    countSql += ' WHERE s.order_status = ?';
    params.push(status);
  }

  sql += ' ORDER BY s.id DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, limit, offset];

  const [countRows] = await pool.query<RowDataPacket[]>(countSql, params);
  const total = countRows[0].total;

  const [rows] = await pool.query<RowDataPacket[]>(sql, queryParams);

  // Calculate status breakdown across all sales
  const [statusCountsRows] = await pool.query<RowDataPacket[]>(
    'SELECT order_status, COUNT(*) as cnt FROM sales GROUP BY order_status'
  );
  const [totalAllRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM sales');

  const status_counts: Record<string, number> = {
    ALL: totalAllRows[0]?.total || 0,
    ORDER_PLACED: 0,
    DISPATCHED_TO_LAB: 0,
    RECEIVED_FROM_LAB: 0,
    READY_FOR_COLLECTION: 0,
    COLLECTED: 0,
    CANCELLED: 0,
  };
  for (const r of statusCountsRows) {
    if (r.order_status) {
      status_counts[r.order_status] = Number(r.cnt);
    }
  }

  res.json({
    success: true,
    data: {
      sales: rows,
      status_counts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    }
  });
}

export async function getSaleById(req: Request, res: Response): Promise<void> {
  const id = parseInt(String(req.params.id), 10);

  const [saleRows] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, c.full_name as customer_name, c.phone_number, c.email as customer_email, c.address as customer_address,
            u.full_name as processed_by_name
     FROM sales s
     JOIN customers c ON c.id = s.customer_id
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    [id]
  );

  if (saleRows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found.' } });
    return;
  }
  const sale = saleRows[0];

  // Fetch items
  const [items] = await pool.query<RowDataPacket[]>(
    `SELECT si.*,
            CASE
              WHEN si.item_type = 'FRAME' THEN (SELECT CONCAT(brand, ' ', model_name, ' (', color, ')') FROM frames WHERE id = si.product_id)
              WHEN si.item_type = 'LENS' THEN (SELECT CONCAT(brand, ' ', material, ' (Index ', refractive_index, ')') FROM lenses WHERE id = si.product_id)
              WHEN si.item_type = 'ACCESSORY' THEN (SELECT name FROM accessories WHERE id = si.product_id)
            END as item_name
     FROM sale_items si
     WHERE si.sale_id = ?`,
    [id]
  );

  // Fetch payments
  const [payments] = await pool.query<RowDataPacket[]>(
    `SELECT p.*, u.full_name as received_by_name
     FROM payments p
     JOIN users u ON u.id = p.user_id
     WHERE p.sale_id = ?
     ORDER BY p.id ASC`,
    [id]
  );

  // Fetch prescription if linked
  let prescription = null;
  if (sale.prescription_id) {
    const [rxRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM prescriptions WHERE id = ?',
      [sale.prescription_id]
    );
    if (rxRows.length > 0) prescription = rxRows[0];
  }

  res.json({
    success: true,
    data: {
      sale,
      items,
      payments,
      prescription,
    }
  });
}

export async function addPayment(req: Request, res: Response): Promise<void> {
  const saleId = parseInt(String(req.params.id), 10);
  const data = addPaymentSchema.parse(req.body);
  const userId = req.user!.id;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [saleRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, sale_number, total_amount, paid_amount, balance_amount, payment_status FROM sales WHERE id = ? FOR UPDATE',
      [saleId]
    );

    if (saleRows.length === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found.' } });
      await connection.rollback();
      return;
    }

    const sale = saleRows[0];
    const currentBalance = Number(sale.balance_amount);

    if (data.amount > currentBalance) {
      res.status(400).json({
        success: false,
        error: { code: 'EXCESS_PAYMENT', message: `Payment of LKR ${data.amount} exceeds outstanding balance of LKR ${currentBalance}.` }
      });
      await connection.rollback();
      return;
    }

    const newPaid = Number(sale.paid_amount) + data.amount;
    const newBalance = currentBalance - data.amount;
    const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

    // Update sale
    await connection.query(
      'UPDATE sales SET paid_amount = ?, balance_amount = ?, payment_status = ? WHERE id = ?',
      [newPaid, newBalance, newStatus, saleId]
    );

    // Insert payment
    const currentYear = new Date().getFullYear();
    const [payMax] = await connection.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(payment_number, '-', -1) AS UNSIGNED)), 0) as max_seq
       FROM payments WHERE payment_number LIKE ? FOR UPDATE`,
      [`PAY-${currentYear}-%`]
    );
    const paySeq = ((payMax[0].max_seq || 0) + 1).toString().padStart(4, '0');
    const payNumber = `PAY-${currentYear}-${paySeq}`;

    await connection.query(
      `INSERT INTO payments (payment_number, sale_id, amount, payment_method, payment_type, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [payNumber, saleId, data.amount, data.payment_method, data.payment_type, userId]
    );

    await connection.commit();

    await logAuditEvent(userId, 'RECORD_PAYMENT', 'PAYMENT', saleId, { payNumber, amount: data.amount, newBalance }, req);

    res.json({
      success: true,
      data: {
        saleId,
        payment_number: payNumber,
        amount_paid: data.amount,
        new_paid_total: newPaid,
        remaining_balance: newBalance,
        payment_status: newStatus,
      }
    });

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const saleId = parseInt(String(req.params.id), 10);
  const { order_status } = req.body;
  const userId = req.user!.id;

  const validStatuses = ['ORDER_PLACED', 'DISPATCHED_TO_LAB', 'RECEIVED_FROM_LAB', 'READY_FOR_COLLECTION', 'COLLECTED', 'CANCELLED'];
  if (!validStatuses.includes(order_status)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid order status specified.' } });
    return;
  }

  const [saleRows] = await pool.query<RowDataPacket[]>('SELECT s.*, c.full_name as customer_name, c.email as customer_email FROM sales s JOIN customers c ON c.id = s.customer_id WHERE s.id = ?', [saleId]);
  if (saleRows.length === 0) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Sale not found.' } });
    return;
  }
  const sale = saleRows[0];

  await pool.query('UPDATE sales SET order_status = ? WHERE id = ?', [order_status, saleId]);

  // If status is updated to RECEIVED_FROM_LAB or READY_FOR_COLLECTION, auto-generate OptoRecall order-ready draft!
  if (order_status === 'RECEIVED_FROM_LAB' || order_status === 'READY_FOR_COLLECTION') {
    const subject = `Your Prescription Eyewear is Ready for Collection — Indian Optician`;
    const body = `Dear ${sale.customer_name},\n\nWe are delighted to inform you that your custom spectacle order (${sale.sale_number}) has been completed and quality inspected.\n\nYour eyewear is now ready for collection at Indian Optician, Main Street, Nintavur.\n\nOutstanding balance: LKR ${Number(sale.balance_amount).toFixed(2)}\n\nWarm regards,\nIndian Optician, Nintavur`;

    // Check if duplicate draft already exists
    const [existingComm] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM communications WHERE related_sale_id = ? AND comm_type = 'ORDER_READY'",
      [saleId]
    );

    if (existingComm.length === 0 && sale.customer_email) {
      await pool.query(
        `INSERT INTO communications (customer_id, related_sale_id, comm_type, channel, recipient_contact, subject, message_body, status)
         VALUES (?, ?, 'ORDER_READY', 'EMAIL', ?, ?, ?, 'DRAFT_PENDING_APPROVAL')`,
        [sale.customer_id, saleId, sale.customer_email, subject, body]
      );
    }
  }

  await logAuditEvent(userId, 'UPDATE_ORDER_STATUS', 'SALE', saleId, { previous: sale.order_status, current: order_status }, req);

  res.json({
    success: true,
    data: { saleId, order_status }
  });
}
