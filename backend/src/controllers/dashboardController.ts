import { Request, Response } from 'express';
import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export async function getDashboardMetrics(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const isAdmin = user.role === 'ADMIN';

  // 1. Operational Counts (Visible to both Admin and Staff)
  const [ordersAtLab] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM sales WHERE order_status = 'DISPATCHED_TO_LAB'"
  );
  const [ordersReady] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM sales WHERE order_status IN ('RECEIVED_FROM_LAB', 'READY_FOR_COLLECTION')"
  );
  const [totalCustomers] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM customers');

  // Low stock counts across frames, lenses, and optical accessories
  const [lowFrames] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM frames WHERE stock_quantity <= low_stock_threshold AND is_active = 1');
  const [lowLenses] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM lenses WHERE stock_quantity <= low_stock_threshold AND is_available = 1');
  const [lowAccessories] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM accessories WHERE stock_quantity <= low_stock_threshold AND is_active = 1');
  const lowStockCount = (lowFrames[0]?.cnt || 0) + (lowLenses[0]?.cnt || 0) + (lowAccessories[0]?.cnt || 0);

  // Pending Communication Approvals
  const [pendingDrafts] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as cnt FROM communications WHERE status = 'DRAFT_PENDING_APPROVAL'"
  );

  // Recent operational orders list
  const [recentOrders] = await pool.query<RowDataPacket[]>(
    `SELECT s.id, s.sale_number, s.total_amount, s.paid_amount, s.balance_amount,
            s.order_status, s.payment_status, s.created_at,
            c.full_name as customer_name, c.phone_number
     FROM sales s
     JOIN customers c ON c.id = s.customer_id
     ORDER BY s.id DESC
     LIMIT 8`
  );

  // 2. Clinical Queue Metrics (Persons in chair & examinations completed today)
  const [examinedTodayRows] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(DISTINCT customer_id) as cnt FROM examinations WHERE DATE(created_at) = CURDATE() OR DATE(exam_date) = CURDATE()'
  );
  const examinedToday = examinedTodayRows[0]?.cnt || 0;

  // Persons in chair: customers without an examination, or registered today without an exam today
  const [inChairRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT c.id) as cnt
     FROM customers c
     WHERE (c.id NOT IN (SELECT DISTINCT customer_id FROM examinations))
        OR (DATE(c.created_at) = CURDATE() AND c.id NOT IN (
            SELECT customer_id FROM examinations WHERE DATE(created_at) = CURDATE() OR DATE(exam_date) = CURDATE()
        ))`
  );
  const inChairNow = inChairRows[0]?.cnt || 0;

  // Orders waiting 3+ days
  const [ordersWaiting3DaysRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as cnt FROM sales
     WHERE order_status IN ('RECEIVED_FROM_LAB', 'READY_FOR_COLLECTION')
       AND created_at <= NOW() - INTERVAL 3 DAY`
  );
  const ordersWaiting3Days = ordersWaiting3DaysRows[0]?.cnt || 0;

  // 3. Financial Metrics (Exclusive to Administrator / Optometrist)
  let financialMetrics: any = null;
  let revenueChart: any[] = [];
  let topProducts: any[] = [];

  const [todaySales] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as count
     FROM sales
     WHERE DATE(created_at) = CURDATE()`
  );
  const todayRevenue = Number(todaySales[0].revenue);
  const todayOrdersCount = Number(todaySales[0].count);

  if (isAdmin) {
    const [monthSales] = await pool.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as count
       FROM sales
       WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`
    );

    const [totalOutstanding] = await pool.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(balance_amount), 0) as balance FROM sales WHERE balance_amount > 0'
    );

    financialMetrics = {
      todayRevenue,
      todayOrdersCount,
      monthRevenue: Number(monthSales[0].revenue),
      monthOrdersCount: Number(monthSales[0].count),
      totalOutstandingBalance: Number(totalOutstanding[0].balance),
    };

    // Revenue chart data for Recharts (past 6 months)
    const [chartRows] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(MIN(created_at), '%b %Y') as month_label,
              COALESCE(SUM(total_amount), 0) as revenue,
              COUNT(*) as order_count
       FROM sales
       WHERE created_at >= NOW() - INTERVAL 6 MONTH
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY MIN(created_at) ASC`
    );
    revenueChart = chartRows;

    // Top selling frame models
    const [topFrameRows] = await pool.query<RowDataPacket[]>(
      `SELECT CONCAT(f.brand, ' ', f.model_name) as name, SUM(si.quantity) as units_sold
       FROM sale_items si
       JOIN frames f ON f.id = si.product_id
       WHERE si.item_type = 'FRAME'
       GROUP BY f.id
       ORDER BY units_sold DESC
       LIMIT 5`
    );
    topProducts = topFrameRows;
  }

  // 4. Dynamic Decisions & Alerts (Low stock, Dispensing review, OptoRecall)
  const [lowStockFrames] = await pool.query<RowDataPacket[]>(
    `SELECT id, brand, model_name as name, frame_code as code, stock_quantity, low_stock_threshold, 'FRAME' as item_type
     FROM frames WHERE stock_quantity <= low_stock_threshold AND is_active = 1
     ORDER BY stock_quantity ASC LIMIT 8`
  );
  const [lowStockLenses] = await pool.query<RowDataPacket[]>(
    `SELECT id, brand, material as name, lens_code as code, stock_quantity, low_stock_threshold, 'LENS' as item_type
     FROM lenses WHERE stock_quantity <= low_stock_threshold AND is_available = 1
     ORDER BY stock_quantity ASC LIMIT 8`
  );
  const [lowStockAccessories] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, item_code as code, stock_quantity, low_stock_threshold, 'ACCESSORY' as item_type
     FROM accessories WHERE stock_quantity <= low_stock_threshold AND is_active = 1
     ORDER BY stock_quantity ASC LIMIT 8`
  );

  const [pendingDispensingPatients] = await pool.query<RowDataPacket[]>(
    `SELECT c.id, c.customer_code, c.full_name, MAX(e.exam_date) as last_exam
     FROM customers c
     JOIN examinations e ON e.customer_id = c.id
     WHERE c.id NOT IN (
       SELECT customer_id FROM sales WHERE order_status NOT IN ('COLLECTED', 'CANCELLED')
     )
     GROUP BY c.id
     ORDER BY last_exam DESC
     LIMIT 5`
  );

  const decisions: Array<{
    id: string;
    title: string;
    description: string;
    actionText: string;
    actionPage: string;
    type: 'STOCK_ALERT' | 'LENSIQ_RECOMMENDATION' | 'RECALL' | 'FORECAST';
    badge?: string;
  }> = [];

  for (const item of [...lowStockFrames, ...lowStockLenses, ...lowStockAccessories]) {
    const isOut = item.stock_quantity === 0;
    const itemLabel = item.item_type === 'ACCESSORY' ? item.name : `${item.brand} ${item.name}`;
    decisions.push({
      id: `stock-${item.item_type}-${item.id}`,
      title: `${isOut ? 'Out of Stock' : 'Low Stock Alert'}: ${itemLabel} (${item.code})`,
      description: `${item.stock_quantity} unit(s) remaining in stock (Reorder threshold: ${item.low_stock_threshold}). Replenishment required.`,
      actionText: 'Restock / View',
      actionPage: 'inventory',
      type: 'STOCK_ALERT',
      badge: isOut ? 'OUT OF STOCK' : 'LOW STOCK',
    });
  }

  for (const patient of pendingDispensingPatients) {
    decisions.push({
      id: `lens-dispense-${patient.id}`,
      title: `LensIQ Dispensing: ${patient.full_name} (${patient.customer_code})`,
      description: `Examined on ${new Date(patient.last_exam).toLocaleDateString()}. Prescription on file and ready for spectacle dispensing.`,
      actionText: 'Dispense Order',
      actionPage: 'new-sale',
      type: 'LENSIQ_RECOMMENDATION',
    });
  }

  decisions.push({
    id: 'optorecall-annual',
    title: 'OptoRecall: Annual Optical Reviews Due',
    description: 'Nintavur patients whose last refraction was 12+ months ago. Automated clinical recall drafts ready for dispatch.',
    actionText: 'Open OptoRecall',
    actionPage: 'recall',
    type: 'RECALL',
  });

  // 5. Daily Takings for the past 7 days (dynamic histogram)
  const [dailySalesRows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE(created_at) as sale_date,
            COALESCE(SUM(total_amount), 0) as day_revenue
     FROM sales
     WHERE created_at >= CURDATE() - INTERVAL 6 DAY
     GROUP BY DATE(created_at)`
  );

  const salesMap = new Map<string, number>();
  for (const row of dailySalesRows) {
    const d = new Date(row.sale_date);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    salesMap.set(dStr, Number(row.day_revenue || 0));
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyTakings: Array<{ day: string; date: string; revenue: number; isToday: boolean }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isToday = i === 0;
    const dayLabel = isToday ? 'Today' : dayNames[d.getDay()];
    const revenue = isToday ? todayRevenue : (salesMap.get(dStr) || 0);
    dailyTakings.push({
      day: dayLabel,
      date: dStr,
      revenue,
      isToday,
    });
  }

  const chairSlotsTarget = 12;

  res.json({
    success: true,
    data: {
      role: user.role,
      clinical: {
        examinedToday,
        inChairNow,
        pendingLensIQReviews: pendingDispensingPatients.length,
        chairTarget: {
          completed: examinedToday,
          target: chairSlotsTarget,
          sublabel: `${examinedToday} of ${chairSlotsTarget} slots`,
        },
      },
      operational: {
        ordersAtLab: ordersAtLab[0].cnt,
        ordersReadyForCollection: ordersReady[0].cnt,
        ordersWaiting3Days,
        totalCustomers: totalCustomers[0].cnt,
        lowStockAlerts: lowStockCount,
        pendingApprovals: pendingDrafts[0].cnt,
        todaySalesCount: todayOrdersCount,
        todayRevenue,
        recentOrders,
      },
      financial: financialMetrics,
      dailyTakings,
      decisions,
      // Flat fallbacks for backward compatibility
      examinedToday,
      inChairNow,
      todayRevenue,
      todaySalesCount: todayOrdersCount,
      ordersAtLab: ordersAtLab[0].cnt,
      ordersReady: ordersReady[0].cnt,
      ordersWaiting3Days,
      revenueChart,
      topProducts,
    }
  });
}
