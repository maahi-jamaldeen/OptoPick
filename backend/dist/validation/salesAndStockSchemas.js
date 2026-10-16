"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPaymentSchema = exports.createSaleSchema = exports.saleItemInputSchema = exports.stockInSchema = exports.accessorySchema = exports.lensSchema = exports.frameSchema = void 0;
const zod_1 = require("zod");
exports.frameSchema = zod_1.z.object({
    frame_code: zod_1.z.string().min(2).max(30),
    brand: zod_1.z.string().min(1).max(50),
    model_name: zod_1.z.string().min(1).max(50),
    shape: zod_1.z.string().min(1).max(30),
    color: zod_1.z.string().min(1).max(30),
    material: zod_1.z.string().min(1).max(30),
    size: zod_1.z.string().min(1).max(20),
    selling_price: zod_1.z.coerce.number().positive('Selling price must be positive'),
    supplier_id: zod_1.z.coerce.number().int().positive(),
    stock_quantity: zod_1.z.coerce.number().int().min(0).default(0),
    low_stock_threshold: zod_1.z.coerce.number().int().min(1).default(2),
});
exports.lensSchema = zod_1.z.object({
    lens_code: zod_1.z.string().min(2).max(30),
    brand: zod_1.z.string().min(1).max(50),
    design_type: zod_1.z.enum(['SINGLE_VISION', 'BIFOCAL', 'PROGRESSIVE']),
    material: zod_1.z.string().min(1).max(30),
    refractive_index: zod_1.z.coerce.number().min(1.4).max(1.9),
    coatings: zod_1.z.string().min(1).max(100),
    min_sph: zod_1.z.coerce.number().min(-25).max(25),
    max_sph: zod_1.z.coerce.number().min(-25).max(25),
    min_cyl: zod_1.z.coerce.number().min(-15).max(15),
    max_cyl: zod_1.z.coerce.number().min(-15).max(15),
    min_add: zod_1.z.coerce.number().min(0).max(5).optional().nullable(),
    max_add: zod_1.z.coerce.number().min(0).max(5).optional().nullable(),
    selling_price: zod_1.z.coerce.number().positive(),
    supplier_id: zod_1.z.coerce.number().int().positive(),
    stock_quantity: zod_1.z.coerce.number().int().min(0).default(0),
    low_stock_threshold: zod_1.z.coerce.number().int().min(1).default(2),
});
exports.accessorySchema = zod_1.z.object({
    item_code: zod_1.z.string().min(2).max(30),
    name: zod_1.z.string().min(1).max(100),
    selling_price: zod_1.z.coerce.number().positive(),
    supplier_id: zod_1.z.coerce.number().int().positive(),
    stock_quantity: zod_1.z.coerce.number().int().min(0).default(0),
    low_stock_threshold: zod_1.z.coerce.number().int().min(1).default(5),
});
exports.stockInSchema = zod_1.z.object({
    product_type: zod_1.z.enum(['FRAME', 'LENS', 'ACCESSORY']).optional(),
    item_type: zod_1.z.enum(['FRAME', 'LENS', 'ACCESSORY']).optional(),
    product_id: zod_1.z.coerce.number().int().positive().optional(),
    item_id: zod_1.z.coerce.number().int().positive().optional(),
    quantity: zod_1.z.coerce.number().int().positive('Quantity received must be at least 1'),
    notes: zod_1.z.string().optional().or(zod_1.z.literal('')),
    reason: zod_1.z.string().optional().or(zod_1.z.literal('')),
    supplier_reference: zod_1.z.string().optional().or(zod_1.z.literal('')),
    unit_cost: zod_1.z.coerce.number().optional(),
}).transform((data) => {
    const pType = data.product_type || data.item_type || 'FRAME';
    const pId = data.product_id || data.item_id || 1;
    const pNotes = data.notes || data.reason || (data.supplier_reference ? `Supplier Ref: ${data.supplier_reference}` : 'Supplier replenishment');
    return {
        product_type: pType,
        product_id: Number(pId),
        quantity: data.quantity,
        notes: pNotes,
    };
});
exports.saleItemInputSchema = zod_1.z.object({
    item_type: zod_1.z.enum(['FRAME', 'LENS', 'ACCESSORY']),
    product_id: zod_1.z.coerce.number().int().positive().optional(),
    item_id: zod_1.z.coerce.number().int().positive().optional(),
    quantity: zod_1.z.coerce.number().int().positive(),
    unit_price: zod_1.z.coerce.number().nonnegative(),
}).transform((data) => ({
    item_type: data.item_type,
    product_id: Number(data.product_id || data.item_id),
    quantity: data.quantity,
    unit_price: data.unit_price,
}));
exports.createSaleSchema = zod_1.z.object({
    customer_id: zod_1.z.coerce.number().int().positive(),
    prescription_id: zod_1.z.coerce.number().int().positive().optional().nullable(),
    items: zod_1.z.array(exports.saleItemInputSchema).min(1, 'At least one item must be included in the sale'),
    discount_amount: zod_1.z.coerce.number().nonnegative().default(0),
    paid_amount: zod_1.z.coerce.number().nonnegative().default(0),
    payment_method: zod_1.z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).default('CASH'),
    order_type: zod_1.z.enum(['IMMEDIATE_SALE', 'CUSTOM_FITTING_ORDER']),
    notes: zod_1.z.string().optional().or(zod_1.z.literal('')),
});
exports.addPaymentSchema = zod_1.z.object({
    amount: zod_1.z.coerce.number().positive('Payment amount must be greater than zero'),
    payment_method: zod_1.z.enum(['CASH', 'CARD', 'BANK_TRANSFER']),
    payment_type: zod_1.z.enum(['ADVANCE', 'BALANCE', 'FULL']),
});
