import { z } from 'zod';

export const frameSchema = z.object({
  frame_code: z.string().min(2).max(30),
  brand: z.string().min(1).max(50),
  model_name: z.string().min(1).max(50),
  shape: z.string().min(1).max(30),
  color: z.string().min(1).max(30),
  material: z.string().min(1).max(30),
  size: z.string().min(1).max(20),
  selling_price: z.coerce.number().positive('Selling price must be positive'),
  supplier_id: z.coerce.number().int().positive(),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(1).default(2),
});

export const lensSchema = z.object({
  lens_code: z.string().min(2).max(30),
  brand: z.string().min(1).max(50),
  design_type: z.enum(['SINGLE_VISION', 'BIFOCAL', 'PROGRESSIVE']),
  material: z.string().min(1).max(30),
  refractive_index: z.coerce.number().min(1.4).max(1.9),
  coatings: z.string().min(1).max(100),
  min_sph: z.coerce.number().min(-25).max(25),
  max_sph: z.coerce.number().min(-25).max(25),
  min_cyl: z.coerce.number().min(-15).max(15),
  max_cyl: z.coerce.number().min(-15).max(15),
  min_add: z.coerce.number().min(0).max(5).optional().nullable(),
  max_add: z.coerce.number().min(0).max(5).optional().nullable(),
  selling_price: z.coerce.number().positive(),
  supplier_id: z.coerce.number().int().positive(),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(1).default(2),
});

export const accessorySchema = z.object({
  item_code: z.string().min(2).max(30),
  name: z.string().min(1).max(100),
  selling_price: z.coerce.number().positive(),
  supplier_id: z.coerce.number().int().positive(),
  stock_quantity: z.coerce.number().int().min(0).default(0),
  low_stock_threshold: z.coerce.number().int().min(1).default(5),
});

export const stockInSchema = z.object({
  product_type: z.enum(['FRAME', 'LENS', 'ACCESSORY']).optional(),
  item_type: z.enum(['FRAME', 'LENS', 'ACCESSORY']).optional(),
  product_id: z.coerce.number().int().positive().optional(),
  item_id: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive('Quantity received must be at least 1'),
  notes: z.string().optional().or(z.literal('')),
  reason: z.string().optional().or(z.literal('')),
  supplier_reference: z.string().optional().or(z.literal('')),
  supplier_name: z.string().optional().or(z.literal('')),
  unit_cost: z.coerce.number().optional(),
}).transform((data) => {
  const pType = data.product_type || data.item_type || 'FRAME';
  const pId = data.product_id || data.item_id || 1;
  const pNotes = data.notes || data.reason || (data.supplier_reference ? `Supplier Ref: ${data.supplier_reference}` : 'Supplier replenishment');
  return {
    product_type: pType as 'FRAME' | 'LENS' | 'ACCESSORY',
    product_id: Number(pId),
    quantity: data.quantity,
    notes: pNotes,
    unit_cost: data.unit_cost !== undefined && !isNaN(Number(data.unit_cost)) ? Number(data.unit_cost) : null,
    supplier_reference: data.supplier_reference || null,
    supplier_name: data.supplier_name || null,
  };
});

export const saleItemInputSchema = z.object({
  item_type: z.enum(['FRAME', 'LENS', 'ACCESSORY']),
  product_id: z.coerce.number().int().positive().optional(),
  item_id: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive(),
  unit_price: z.coerce.number().nonnegative(),
}).transform((data) => ({
  item_type: data.item_type,
  product_id: Number(data.product_id || data.item_id),
  quantity: data.quantity,
  unit_price: data.unit_price,
}));

export const createSaleSchema = z.object({
  customer_id: z.coerce.number().int().positive(),
  prescription_id: z.coerce.number().int().positive().optional().nullable(),
  items: z.array(saleItemInputSchema).min(1, 'At least one item must be included in the sale'),
  discount_amount: z.coerce.number().nonnegative().default(0),
  paid_amount: z.coerce.number().nonnegative().default(0),
  payment_method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']).default('CASH'),
  order_type: z.enum(['IMMEDIATE_SALE', 'CUSTOM_FITTING_ORDER']),
  notes: z.string().optional().or(z.literal('')),
});

export const addPaymentSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  payment_method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER']),
  payment_type: z.enum(['ADVANCE', 'BALANCE', 'FULL']),
});
