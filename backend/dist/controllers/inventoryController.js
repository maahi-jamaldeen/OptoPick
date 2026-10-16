"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInventoryStatus = getInventoryStatus;
exports.recordStockIn = recordStockIn;
exports.getMovements = getMovements;
const db_js_1 = __importDefault(require("../config/db.js"));
const salesAndStockSchemas_js_1 = require("../validation/salesAndStockSchemas.js");
const security_js_1 = require("../utils/security.js");
async function getInventoryStatus(req, res) {
    const filter = req.query.status; // 'LOW_STOCK', 'OUT_OF_STOCK', 'ALL'
    // Query unified frames, lenses, accessories
    const [frames] = await db_js_1.default.query(`SELECT 'FRAME' as product_type, 'FRAME' as item_type, id,
            frame_code as code, frame_code as item_code,
            CONCAT(brand, ' ', model_name, ' (', color, ' ', size, ')') as name,
            CONCAT(brand, ' ', model_name, ' (', color, ' ', size, ')') as item_name,
            stock_quantity, low_stock_threshold, selling_price,
            CASE
              WHEN stock_quantity = 0 THEN 'OUT_OF_STOCK'
              WHEN stock_quantity <= low_stock_threshold THEN 'LOW_STOCK'
              ELSE 'IN_STOCK'
            END as status
     FROM frames WHERE is_active = 1`);
    const [lenses] = await db_js_1.default.query(`SELECT 'LENS' as product_type, 'LENS' as item_type, id,
            lens_code as code, lens_code as item_code,
            CONCAT(brand, ' ', REPLACE(design_type, '_', ' '), ' ', material, ' (Index ', refractive_index, ')') as name,
            CONCAT(brand, ' ', REPLACE(design_type, '_', ' '), ' ', material, ' (Index ', refractive_index, ')') as item_name,
            stock_quantity, low_stock_threshold, selling_price,
            CASE
              WHEN stock_quantity = 0 THEN 'OUT_OF_STOCK'
              WHEN stock_quantity <= low_stock_threshold THEN 'LOW_STOCK'
              ELSE 'IN_STOCK'
            END as status
     FROM lenses WHERE is_available = 1`);
    const [accessories] = await db_js_1.default.query(`SELECT 'ACCESSORY' as product_type, 'ACCESSORY' as item_type, id,
            item_code as code, item_code,
            name, name as item_name,
            stock_quantity, low_stock_threshold, selling_price,
            CASE
              WHEN stock_quantity = 0 THEN 'OUT_OF_STOCK'
              WHEN stock_quantity <= low_stock_threshold THEN 'LOW_STOCK'
              ELSE 'IN_STOCK'
            END as status
     FROM accessories WHERE is_active = 1`);
    let combined = [...frames, ...lenses, ...accessories];
    if (filter === 'LOW_STOCK') {
        combined = combined.filter(item => item.status === 'LOW_STOCK');
    }
    else if (filter === 'OUT_OF_STOCK') {
        combined = combined.filter(item => item.status === 'OUT_OF_STOCK');
    }
    else if (filter === 'ATTENTION') {
        combined = combined.filter(item => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK');
    }
    const lowStockCount = combined.filter(i => i.status === 'LOW_STOCK').length;
    const outOfStockCount = combined.filter(i => i.status === 'OUT_OF_STOCK').length;
    res.json({
        success: true,
        data: {
            items: combined,
            summary: {
                totalItems: combined.length,
                lowStockCount,
                outOfStockCount,
            }
        }
    });
}
async function recordStockIn(req, res) {
    const data = salesAndStockSchemas_js_1.stockInSchema.parse(req.body);
    const userId = req.user.id;
    const connection = await db_js_1.default.getConnection();
    try {
        await connection.beginTransaction();
        let table = '';
        if (data.product_type === 'FRAME')
            table = 'frames';
        else if (data.product_type === 'LENS')
            table = 'lenses';
        else if (data.product_type === 'ACCESSORY')
            table = 'accessories';
        // Get current stock
        const [rows] = await connection.query(`SELECT id, stock_quantity FROM ${table} WHERE id = ? FOR UPDATE`, [data.product_id]);
        if (rows.length === 0) {
            res.status(404).json({ success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Target product not found.' } });
            await connection.rollback();
            return;
        }
        const prevQty = rows[0].stock_quantity;
        const newQty = prevQty + data.quantity;
        // Update stock quantity
        await connection.query(`UPDATE ${table} SET stock_quantity = ? WHERE id = ?`, [newQty, data.product_id]);
        // Record movement
        await connection.query(`INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, user_id, notes)
       VALUES (?, ?, 'STOCK_IN', ?, ?, ?, ?, ?)`, [data.product_type, data.product_id, data.quantity, prevQty, newQty, userId, data.notes || 'Supplier replenishment']);
        await connection.commit();
        await (0, security_js_1.logAuditEvent)(userId, 'STOCK_IN', data.product_type, data.product_id, {
            received: data.quantity,
            previousQuantity: prevQty,
            newQuantity: newQty
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
    }
    catch (err) {
        await connection.rollback();
        throw err;
    }
    finally {
        connection.release();
    }
}
async function getMovements(req, res) {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * limit;
    const [countRows] = await db_js_1.default.query('SELECT COUNT(*) as total FROM inventory_movements');
    const total = countRows[0].total;
    const [rows] = await db_js_1.default.query(`SELECT m.*,
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
     LIMIT ? OFFSET ?`, [limit, offset]);
    res.json({
        success: true,
        data: {
            movements: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        }
    });
}
