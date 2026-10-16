"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFrames = getFrames;
exports.createFrame = createFrame;
exports.getLenses = getLenses;
exports.createLens = createLens;
exports.getAccessories = getAccessories;
exports.createAccessory = createAccessory;
const db_js_1 = __importDefault(require("../config/db.js"));
const salesAndStockSchemas_js_1 = require("../validation/salesAndStockSchemas.js");
const security_js_1 = require("../utils/security.js");
// --- FRAMES ---
async function getFrames(req, res) {
    const brand = req.query.brand;
    const shape = req.query.shape;
    const inStockOnly = req.query.inStock === 'true';
    let sql = `SELECT f.*, s.name as supplier_name
             FROM frames f
             LEFT JOIN suppliers s ON s.id = f.supplier_id
             WHERE f.is_active = 1`;
    const params = [];
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
    const [rows] = await db_js_1.default.query(sql, params);
    res.json({ success: true, data: { frames: rows } });
}
async function createFrame(req, res) {
    const data = salesAndStockSchemas_js_1.frameSchema.parse(req.body);
    const [result] = await db_js_1.default.query(`INSERT INTO frames (frame_code, brand, model_name, shape, color, material, size, selling_price, supplier_id, stock_quantity, low_stock_threshold, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [
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
    ]);
    // If initial stock > 0, record initial stock movement
    if (data.stock_quantity > 0) {
        await db_js_1.default.query(`INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, user_id, notes)
       VALUES ('FRAME', ?, 'STOCK_IN', ?, 0, ?, ?, 'Initial inventory addition')`, [result.insertId, data.stock_quantity, data.stock_quantity, req.user.id]);
    }
    await (0, security_js_1.logAuditEvent)(req.user.id, 'CREATE_FRAME', 'FRAME', result.insertId, { code: data.frame_code }, req);
    res.status(201).json({
        success: true,
        data: { id: result.insertId, ...data }
    });
}
// --- LENSES ---
async function getLenses(req, res) {
    const design = req.query.design;
    const inStockOnly = req.query.inStock === 'true';
    let sql = `SELECT l.*, s.name as supplier_name
             FROM lenses l
             LEFT JOIN suppliers s ON s.id = l.supplier_id
             WHERE l.is_available = 1`;
    const params = [];
    if (design) {
        sql += ' AND l.design_type = ?';
        params.push(design);
    }
    if (inStockOnly) {
        sql += ' AND l.stock_quantity > 0';
    }
    sql += ' ORDER BY l.refractive_index ASC, l.selling_price ASC';
    const [rows] = await db_js_1.default.query(sql, params);
    res.json({ success: true, data: { lenses: rows } });
}
async function createLens(req, res) {
    const data = salesAndStockSchemas_js_1.lensSchema.parse(req.body);
    const [result] = await db_js_1.default.query(`INSERT INTO lenses
     (lens_code, brand, design_type, material, refractive_index, coatings, min_sph, max_sph, min_cyl, max_cyl, min_add, max_add, selling_price, supplier_id, stock_quantity, low_stock_threshold, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`, [
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
    ]);
    if (data.stock_quantity > 0) {
        await db_js_1.default.query(`INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, user_id, notes)
       VALUES ('LENS', ?, 'STOCK_IN', ?, 0, ?, ?, 'Initial inventory addition')`, [result.insertId, data.stock_quantity, data.stock_quantity, req.user.id]);
    }
    await (0, security_js_1.logAuditEvent)(req.user.id, 'CREATE_LENS', 'LENS', result.insertId, { code: data.lens_code }, req);
    res.status(201).json({
        success: true,
        data: { id: result.insertId, ...data }
    });
}
// --- ACCESSORIES ---
async function getAccessories(req, res) {
    const [rows] = await db_js_1.default.query(`SELECT a.*, s.name as supplier_name
     FROM accessories a
     LEFT JOIN suppliers s ON s.id = a.supplier_id
     WHERE a.is_active = 1
     ORDER BY a.name ASC`);
    res.json({ success: true, data: { accessories: rows } });
}
async function createAccessory(req, res) {
    const data = salesAndStockSchemas_js_1.accessorySchema.parse(req.body);
    const [result] = await db_js_1.default.query(`INSERT INTO accessories (item_code, name, selling_price, supplier_id, stock_quantity, low_stock_threshold, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`, [
        data.item_code,
        data.name,
        data.selling_price,
        data.supplier_id,
        data.stock_quantity,
        data.low_stock_threshold,
    ]);
    if (data.stock_quantity > 0) {
        await db_js_1.default.query(`INSERT INTO inventory_movements (product_type, product_id, movement_type, quantity_change, previous_quantity, new_quantity, user_id, notes)
       VALUES ('ACCESSORY', ?, 'STOCK_IN', ?, 0, ?, ?, 'Initial inventory addition')`, [result.insertId, data.stock_quantity, data.stock_quantity, req.user.id]);
    }
    await (0, security_js_1.logAuditEvent)(req.user.id, 'CREATE_ACCESSORY', 'ACCESSORY', result.insertId, { code: data.item_code }, req);
    res.status(201).json({
        success: true,
        data: { id: result.insertId, ...data }
    });
}
