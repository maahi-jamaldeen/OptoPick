"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = getDashboardMetrics;
const db_js_1 = __importDefault(require("../config/db.js"));
async function getDashboardMetrics(req, res) {
    const user = req.user;
    const isAdmin = user.role === 'ADMIN';
    // 1. Operational Counts (Visible to both Admin and Staff)
    const [ordersAtLab] = await db_js_1.default.query("SELECT COUNT(*) as cnt FROM sales WHERE order_status = 'DISPATCHED_TO_LAB'");
    const [ordersReady] = await db_js_1.default.query("SELECT COUNT(*) as cnt FROM sales WHERE order_status IN ('RECEIVED_FROM_LAB', 'READY_FOR_COLLECTION')");
    const [totalCustomers] = await db_js_1.default.query('SELECT COUNT(*) as cnt FROM customers');
    // Low stock counts
    const [lowFrames] = await db_js_1.default.query('SELECT COUNT(*) as cnt FROM frames WHERE stock_quantity <= low_stock_threshold AND is_active = 1');
    const [lowLenses] = await db_js_1.default.query('SELECT COUNT(*) as cnt FROM lenses WHERE stock_quantity <= low_stock_threshold AND is_available = 1');
    const lowStockCount = (lowFrames[0].cnt || 0) + (lowLenses[0].cnt || 0);
    // Pending Communication Approvals
    const [pendingDrafts] = await db_js_1.default.query("SELECT COUNT(*) as cnt FROM communications WHERE status = 'DRAFT_PENDING_APPROVAL'");
    // Recent operational orders list
    const [recentOrders] = await db_js_1.default.query(`SELECT s.id, s.sale_number, s.total_amount, s.paid_amount, s.balance_amount,
            s.order_status, s.payment_status, s.created_at,
            c.full_name as customer_name, c.phone_number
     FROM sales s
     JOIN customers c ON c.id = s.customer_id
     ORDER BY s.id DESC
     LIMIT 8`);
    // 2. Clinical Queue Metrics (Persons in chair & examinations completed today)
    const [examinedTodayRows] = await db_js_1.default.query('SELECT COUNT(DISTINCT customer_id) as cnt FROM examinations WHERE DATE(created_at) = CURDATE() OR DATE(exam_date) = CURDATE()');
    const examinedToday = examinedTodayRows[0]?.cnt || 0;
    // Persons in chair: customers without an examination, or registered today without an exam today
    const [inChairRows] = await db_js_1.default.query(`SELECT COUNT(DISTINCT c.id) as cnt
     FROM customers c
     WHERE (c.id NOT IN (SELECT DISTINCT customer_id FROM examinations))
        OR (DATE(c.created_at) = CURDATE() AND c.id NOT IN (
            SELECT customer_id FROM examinations WHERE DATE(created_at) = CURDATE() OR DATE(exam_date) = CURDATE()
        ))`);
    const inChairNow = inChairRows[0]?.cnt || 0;
    // Orders waiting 3+ days
    const [ordersWaiting3DaysRows] = await db_js_1.default.query(`SELECT COUNT(*) as cnt FROM sales
     WHERE order_status IN ('RECEIVED_FROM_LAB', 'READY_FOR_COLLECTION')
       AND created_at <= NOW() - INTERVAL 3 DAY`);
    const ordersWaiting3Days = ordersWaiting3DaysRows[0]?.cnt || 0;
    // 3. Financial Metrics (Exclusive to Administrator / Optometrist)
    let financialMetrics = null;
    let revenueChart = [];
    let topProducts = [];
    const [todaySales] = await db_js_1.default.query(`SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as count
     FROM sales
     WHERE DATE(created_at) = CURDATE()`);
    const todayRevenue = Number(todaySales[0].revenue);
    const todayOrdersCount = Number(todaySales[0].count);
    if (isAdmin) {
        const [monthSales] = await db_js_1.default.query(`SELECT COALESCE(SUM(total_amount), 0) as revenue, COUNT(*) as count
       FROM sales
       WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`);
        const [totalOutstanding] = await db_js_1.default.query('SELECT COALESCE(SUM(balance_amount), 0) as balance FROM sales WHERE balance_amount > 0');
        financialMetrics = {
            todayRevenue,
            todayOrdersCount,
            monthRevenue: Number(monthSales[0].revenue),
            monthOrdersCount: Number(monthSales[0].count),
            totalOutstandingBalance: Number(totalOutstanding[0].balance),
        };
        // Revenue chart data for Recharts (past 6 months)
        const [chartRows] = await db_js_1.default.query(`SELECT DATE_FORMAT(MIN(created_at), '%b %Y') as month_label,
              COALESCE(SUM(total_amount), 0) as revenue,
              COUNT(*) as order_count
       FROM sales
       WHERE created_at >= NOW() - INTERVAL 6 MONTH
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY MIN(created_at) ASC`);
        revenueChart = chartRows;
        // Top selling frame models
        const [topFrameRows] = await db_js_1.default.query(`SELECT CONCAT(f.brand, ' ', f.model_name) as name, SUM(si.quantity) as units_sold
       FROM sale_items si
       JOIN frames f ON f.id = si.product_id
       WHERE si.item_type = 'FRAME'
       GROUP BY f.id
       ORDER BY units_sold DESC
       LIMIT 5`);
        topProducts = topFrameRows;
    }
    res.json({
        success: true,
        data: {
            role: user.role,
            clinical: {
                examinedToday,
                inChairNow,
                pendingLensIQReviews: 3,
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
