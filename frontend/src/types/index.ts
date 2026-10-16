export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  full_name?: string;
  role: 'ADMIN' | 'STAFF';
  isActive?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  ip_address: string | null;
  details: any;
  created_at: string;
  username?: string | null;
  full_name?: string | null;
  role?: string | null;
}

export interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  phone_number: string;
  email?: string | null;
  address?: string | null;
  age?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  occupation?: string | null;
  preferences_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  exam_count?: number;
  sales_count?: number;
  examined_today?: number | boolean;
  latest_exam_date?: string | null;
  latest_exam_created_at?: string | null;
}

export interface Prescription {
  id: number;
  prescription_id?: number;
  exam_id?: number;
  examination_id?: number;
  customer_id: number;
  od_sph: number;
  od_cyl: number;
  od_axis: number;
  od_add?: number | null;
  os_sph: number;
  os_cyl: number;
  os_axis: number;
  os_add?: number | null;
  pd: number;
  is_latest: boolean | number;
  exam_date?: string;
  clinical_notes?: string | null;
  examiner_name?: string;
  created_at?: string;
}

export interface Frame {
  id: number;
  frame_code: string;
  brand: string;
  model_name: string;
  model_number?: string;
  shape: string;
  color: string;
  material: string;
  size: string;
  selling_price: number;
  supplier_id: number;
  supplier_name?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Lens {
  id: number;
  lens_code: string;
  brand: string;
  name?: string;
  design_type: 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE';
  material: string;
  refractive_index: number;
  coatings: string;
  min_sph: number;
  max_sph: number;
  min_cyl: number;
  max_cyl: number;
  min_add?: number | null;
  max_add?: number | null;
  selling_price: number;
  supplier_id: number;
  supplier_name?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Accessory {
  id: number;
  item_code: string;
  name: string;
  selling_price: number;
  supplier_id: number;
  supplier_name?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  contact_person?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  credit_terms?: string | null;
  settlement_method?: string | null;
  lead_time?: string | null;
  warranty_terms?: string | null;
  is_active: boolean;
}

export interface InventoryItem {
  product_type: 'FRAME' | 'LENS' | 'ACCESSORY';
  id: number;
  code: string;
  name: string;
  item_name?: string;
  item_code?: string;
  item_type?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  selling_price: number;
  supplier_id?: number;
  supplier_name?: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  created_at?: string;
  updated_at?: string;
}

export interface InventoryMovement {
  id: number;
  product_type: 'FRAME' | 'LENS' | 'ACCESSORY';
  product_id: number;
  movement_type: 'STOCK_IN' | 'SALE_DEDUCTION' | 'RETURN_RESTOCK' | 'ADJUSTMENT' | 'DEFECTIVE_WRITE_OFF';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  item_name?: string;
  quantity?: number;
  reason?: string;
  created_by_name?: string;
  reference_sale_id?: number | null;
  sale_number?: string | null;
  notes?: string | null;
  recorded_by?: string;
  created_at: string;
  unit_cost?: number | null;
  supplier_ref?: string | null;
  supplier_name?: string | null;
}

export interface GoodsReceipt {
  id: number;
  product_type: 'FRAME' | 'LENS' | 'ACCESSORY';
  product_id: number;
  movement_type: 'STOCK_IN';
  quantity_received: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost: number;
  total_cost: number;
  invoice_ref: string;
  supplier_name: string;
  notes?: string | null;
  created_at: string;
  recorded_by?: string;
  item_name?: string;
  item_code?: string;
  retail_price: number;
}

export interface Sale {
  id: number;
  sale_number: string;
  customer_id: number;
  customer_name?: string;
  phone_number?: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID';
  order_status: 'ORDER_PLACED' | 'DISPATCHED_TO_LAB' | 'RECEIVED_FROM_LAB' | 'READY_FOR_COLLECTION' | 'COLLECTED' | 'CANCELLED';
  order_type: 'IMMEDIATE_SALE' | 'CUSTOM_FITTING_ORDER';
  staff_name?: string;
  notes?: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  item_type: 'FRAME' | 'LENS' | 'ACCESSORY';
  product_id: number;
  item_name?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Payment {
  id: number;
  payment_number: string;
  sale_id: number;
  amount: number;
  payment_method: 'CASH' | 'CARD' | 'BANK_TRANSFER';
  payment_type: 'ADVANCE' | 'BALANCE' | 'FULL';
  received_by_name?: string;
  created_at: string;
}

export interface Communication {
  id: number;
  customer_id: number;
  related_sale_id?: number | null;
  comm_type: 'ORDER_READY' | 'ANNUAL_REVIEW_RECALL' | 'LAPSED_RETENTION' | 'PROMOTIONAL';
  communication_type?: string;
  channel: 'EMAIL' | 'SMS_DRAFT';
  recipient_contact: string;
  subject: string;
  message_body: string;
  status: 'DRAFT_PENDING_APPROVAL' | 'APPROVED' | 'DISPATCHED' | 'FAILED' | 'SENT';
  approved_by_name?: string;
  dispatched_at?: string | null;
  delivery_error?: string | null;
  created_at: string;
}

export interface LensIQRecommendation {
  id: number;
  lens_id: number;
  rank: number;
  lens_code: string;
  brand: string;
  name?: string;
  lens_name?: string;
  design_type: string;
  material: string;
  refractive_index: number;
  coatings: string;
  coating?: string;
  selling_price: number;
  price?: number;
  material_explanation: string;
  index_explanation: string;
  coating_suitability: string;
  lifestyle_fit_reason: string;
  recommendation_reason?: string;
  trade_offs: string;
}

export interface OptoForecastInsight {
  id?: number;
  product_id?: number;
  product_type?: 'FRAME' | 'LENS';
  item_type?: string;
  code?: string;
  name: string;
  stock: number;
  threshold?: number;
  sold_30d: number;
  sold_90d?: number;
  days_since_last_sale: number;
  demand_signal: 'Low' | 'Stable' | 'Increasing' | 'High';
  stock_risk: 'None' | 'Possible Shortage' | 'Possible Overstock';
  recommended_action: 'Monitor' | 'Review Reorder' | 'Review Stock Reduction';
  reason: string;
}
