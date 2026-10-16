import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { JourneyBar, JourneyStep } from '../components/Common/JourneyBar';
import { DialGauge } from '../components/Common/DialGauge';
import { StatusBadge } from '../components/Common/StatusBadge';
import { OptoPickAIIcon, LensIQIcon, OptoForecastIcon, OptoRecallIcon, OptoTriageIcon } from '../components/Common/OptoIcons';
import {
  Sparkles,
  ShoppingBag,
  UserPlus,
  Package,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  Send,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const res: any = await api.get('/dashboard/metrics');
        setData(res?.data || res);
      } catch (err: any) {
        console.warn('Dashboard fetch notice:', err);
        // Fallback gracefully so the UI is always accessible
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Format LKR Currency
  const formatLKR = (num: number | undefined) => {
    if (num === undefined || isNaN(num)) return '0';
    return num.toLocaleString('en-US');
  };

  const examinedToday = data?.clinical?.examinedToday ?? data?.operational?.examinedToday ?? data?.examinedToday ?? 0;
  const inChairNow = data?.clinical?.inChairNow ?? data?.operational?.inChairNow ?? data?.inChairNow ?? 0;
  const pendingReviews = data?.clinical?.pendingLensIQReviews ?? 3;

  const todayRevenue = data?.financial?.todayRevenue ?? data?.financialMetrics?.todayRevenue ?? data?.todayRevenue ?? 0;
  const todaySalesCount = data?.operational?.todaySalesCount ?? data?.financial?.todayOrdersCount ?? data?.todaySalesCount ?? 0;
  const monthRevenue = data?.financial?.monthRevenue ?? data?.financialMetrics?.monthRevenue ?? 0;
  const balancesDue = data?.financial?.totalOutstandingBalance ?? data?.financialMetrics?.totalOutstandingBalance ?? 0;
  const ordersAtLab = data?.operational?.ordersAtLab ?? data?.ordersAtLab ?? 0;
  const ordersReady = data?.operational?.ordersReadyForCollection ?? data?.operational?.ordersReady ?? data?.ordersReady ?? 0;
  const ordersWaiting3Days = data?.operational?.ordersWaiting3Days ?? 0;
  const lowStockCount = data?.operational?.lowStockAlerts ?? data?.lowStockCount ?? 0;
  const pendingApprovals = data?.operational?.pendingApprovals ?? data?.pendingDrafts ?? 0;

  const dailyTakings: Array<{ day: string; date: string; revenue: number; isToday: boolean }> =
    data?.dailyTakings || [
      { day: 'Mon', date: '', revenue: 0, isToday: false },
      { day: 'Tue', date: '', revenue: 0, isToday: false },
      { day: 'Wed', date: '', revenue: 0, isToday: false },
      { day: 'Thu', date: '', revenue: 0, isToday: false },
      { day: 'Fri', date: '', revenue: 0, isToday: false },
      { day: 'Sat', date: '', revenue: 0, isToday: false },
      { day: 'Today', date: '', revenue: todayRevenue, isToday: true },
    ];

  const maxDailyRevenue = Math.max(...dailyTakings.map((b) => b.revenue), 1);

  const [decisionsPage, setDecisionsPage] = useState(1);
  const DECISIONS_PER_PAGE = 5;
  const decisionsList = data?.decisions || [];
  const totalDecisionPages = Math.ceil(decisionsList.length / DECISIONS_PER_PAGE) || 1;
  const currentDecisions = decisionsList.slice((decisionsPage - 1) * DECISIONS_PER_PAGE, decisionsPage * DECISIONS_PER_PAGE);

  // Journey Steps for Admin / Optometrist
  const adminJourneySteps: JourneyStep[] = [
    { value: examinedToday, label: 'Examined Today', sub: `${inChairNow} waiting in chair`, onClick: () => onNavigate('customers') },
    { value: pendingReviews, label: 'LensIQ to review', sub: 'waiting for you', variant: 'ai', onClick: () => onNavigate('lens-iq-reviews') },
    { value: todaySalesCount, label: 'Sold', sub: `LKR ${formatLKR(todayRevenue)}`, onClick: () => onNavigate('sales') },
    { value: ordersAtLab, label: 'At fitting centre', sub: 'due Wed to Fri', onClick: () => onNavigate('sales') },
    { value: ordersReady, label: 'Ready to collect', sub: `${ordersWaiting3Days} waiting 3+ days`, variant: 'hot', onClick: () => onNavigate('sales') },
  ];

  // Journey Steps for Optical Staff
  const staffJourneySteps: JourneyStep[] = [
    { value: todaySalesCount, label: 'Ordered today', sub: `LKR ${formatLKR(todayRevenue)}`, onClick: () => onNavigate('sales') },
    { value: ordersAtLab, label: 'At fitting centre', sub: 'fitting lab queue', onClick: () => onNavigate('sales') },
    { value: ordersReady, label: 'Ready to collect', sub: 'notify customers', variant: 'hot', onClick: () => onNavigate('messages') },
    { value: todaySalesCount, label: 'Transactions', sub: 'recorded in POS', onClick: () => onNavigate('sales') },
  ];

  return (
    <div className="content">
      {/* 1. Journey Bar */}
      <JourneyBar
        steps={isAdmin ? adminJourneySteps : staffJourneySteps}
        title={isAdmin ? 'From chair to collection, today' : 'Orders on their way to customers'}
        subtitle={isAdmin ? 'Indian Optician • Clinical Progress' : 'External Fitting Lab & Counter Queue'}
      />

      {/* 2. Staff Quick Actions Grid (Displayed prominently for Front Desk) */}
      {!isAdmin && (
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {/* New Sale */}
          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              padding: '18px 20px',
              backgroundColor: 'var(--primary-action)',
              color: 'var(--primary-action-text)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('new-sale')}
          >
            <div className="kicon" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
              <ShoppingBag size={20} color="var(--primary-action-text)" />
            </div>
            <div>
              <b style={{ fontSize: 15, display: 'block' }}>New Dispensing Sale</b>
              <div style={{ fontSize: 12.5, opacity: 0.85 }}>Frames, lenses &amp; advance</div>
            </div>
          </div>

          {/* New Customer */}
          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              padding: '18px 20px',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('customers')}
          >
            <div className="kicon" style={{ backgroundColor: 'var(--portal-bg)' }}>
              <UserPlus size={20} color="var(--primary-action)" />
            </div>
            <div>
              <b style={{ fontSize: 15, display: 'block' }}>New Customer</b>
              <div className="sub" style={{ fontSize: 12.5 }}>Register contact &amp; lifestyle</div>
            </div>
          </div>

          {/* Record Stock-In */}
          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              padding: '18px 20px',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('inventory')}
          >
            <div className="kicon" style={{ backgroundColor: 'var(--portal-bg)' }}>
              <Package size={20} color="var(--primary-action)" />
            </div>
            <div>
              <b style={{ fontSize: 15, display: 'block' }}>Record Stock-In</b>
              <div className="sub" style={{ fontSize: 12.5 }}>Goods received from supplier</div>
            </div>
          </div>

          {/* LensIQ */}
          <div
            className="card"
            style={{
              flex: 1,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              padding: '18px 20px',
              background: 'var(--prism-gradient)',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('lens-iq')}
          >
            <div className="kicon" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <b style={{ fontSize: 15, display: 'block' }}>Launch LensIQ</b>
              <div style={{ fontSize: 12.5, opacity: 0.9 }}>AI lens selection from stock</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Dashboard Row */}
      <div className="row" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Column: Takings / Targets for Optometrist; Tasks for Staff */}
        {isAdmin ? (
          <div className="card" style={{ width: 340, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ marginBottom: 14 }}>Takings</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-sub)' }}>LKR</span>
                <span className="big tabular-nums" style={{ fontSize: 40, color: 'var(--text-ink)' }}>
                  {formatLKR(todayRevenue)}
                </span>
              </div>
              <span className="sub" style={{ fontSize: 13.5 }}>
                today across {todaySalesCount} sales
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-sub)' }}>LKR</span>
                <span className="big tabular-nums" style={{ fontSize: 26, color: 'var(--text-ink)' }}>
                  {formatLKR(monthRevenue)}
                </span>
              </div>
              <span className="sub" style={{ fontSize: 13, textAlign: 'right', color: 'var(--text-sub)', fontWeight: 600 }}>
                this month
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--status-warn)' }}>LKR</span>
                <span className="big tabular-nums" style={{ fontSize: 22, color: 'var(--status-warn)' }}>
                  {formatLKR(balancesDue)}
                </span>
              </div>
              <span className="sub" style={{ fontSize: 13, textAlign: 'right' }}>
                balances to collect
              </span>
            </div>

            {/* Dynamic 7-Day Daily Bar Histogram */}
            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'stretch', marginTop: 14, minHeight: 110 }}>
              {dailyTakings.map((b, i) => {
                const heightPercent =
                  b.revenue > 0
                    ? Math.max(16, Math.min(100, Math.round((b.revenue / maxDailyRevenue) * 100)))
                    : 6;
                return (
                  <div
                    key={i}
                    title={`${b.day}${b.date ? ` (${b.date})` : ''}: LKR ${formatLKR(b.revenue)}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'default',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPercent}%`,
                        minHeight: b.revenue > 0 ? 12 : 4,
                        borderRadius: '8px 8px 3px 3px',
                        background: b.isToday
                          ? 'var(--prism-gradient)'
                          : b.revenue > 0
                          ? 'var(--primary-action)'
                          : 'rgba(18, 59, 80, 0.12)',
                        transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                    <span
                      className="sub"
                      style={{
                        fontSize: 11,
                        fontWeight: b.isToday ? 700 : 500,
                        color: b.isToday ? 'var(--primary-action)' : 'inherit',
                      }}
                    >
                      {b.day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Dial Targets */}
            <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 18, borderTop: '1px solid var(--border-color)', marginTop: 14 }}>
              <DialGauge
                value={examinedToday}
                max={12}
                label="Chair Target"
                sublabel={`${examinedToday} of 12 slots`}
              />
              <DialGauge
                value={lowStockCount}
                max={Math.max(10, lowStockCount)}
                label="Stock Alerts"
                sublabel={lowStockCount === 0 ? 'Optimal stock' : `${lowStockCount} need reorder`}
                color={lowStockCount === 0 ? 'var(--status-good)' : 'var(--status-bad)'}
              />
            </div>
          </div>
        ) : (
          /* Staff My Tasks Column */
          <div className="card" style={{ flex: 1.35, display: 'flex', flexDirection: 'column' }}>
            <div className="ch">
              <h2>My Dispensing Tasks</h2>
              <span className="r">
                <StatusBadge variant="warn" label="5 Open" icon="clock" />
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="kicon" style={{ backgroundColor: 'var(--lens-violet-bg)', color: 'var(--lens-violet-text)' }}>
                  <Send size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <b>{pendingApprovals} approved customer messages ready to send</b>
                  <div className="sub">Order-ready and review reminders approved by Mr. Musthaq</div>
                </div>
                <button type="button" className="btn s sm" onClick={() => onNavigate('messages')}>
                  Open messages
                </button>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="kicon" style={{ backgroundColor: 'var(--status-info-bg)', color: 'var(--status-info)' }}>
                  <Package size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <b>Notify F. Nazeer (INV-0418) her spectacles are ready</b>
                  <div className="sub">Received from Kalmunai fitting lab at 09:10</div>
                </div>
                <button type="button" className="btn s sm" onClick={() => onNavigate('messages')}>
                  Mark notified
                </button>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '12px 0' }}>
                <div className="kicon" style={{ backgroundColor: 'var(--portal-bg)', color: 'var(--text-ink)' }}>
                  <Package size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <b>Dispatch 2 frame parcels to Kalmunai fitting lab</b>
                  <div className="sub">Selected by Mr. Rizwan and Mrs. Shifa today</div>
                </div>
                <button type="button" className="btn s sm" onClick={() => onNavigate('sales')}>
                  View orders
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: AI "Needs Your Decision" (Admin) or Live Queue (Staff) */}
        {isAdmin ? (
          <div className="card aiw" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="ch">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0 }}>Needs your decision</h2>
                {decisionsList.length > 0 && (
                  <span className="badge" style={{ fontSize: 11, background: 'var(--portal-bg)', color: 'var(--text-sub)' }}>
                    {decisionsList.length} items
                  </span>
                )}
              </div>
              <span className="r">
                <StatusBadge variant="ai" label="OptoTriage Intelligence" icon="triage" />
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {currentDecisions.length === 0 ? (
                <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="sub">All clinical reviews, low stock alerts, and recalls are up to date!</div>
                </div>
              ) : (
                currentDecisions.map((dec: any) => (
                  <div
                    key={dec.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                          {dec.type === 'LENSIQ_RECOMMENDATION' && <LensIQIcon size={16} />}
                          {(dec.type === 'STOCK_ALERT' || dec.type === 'FORECAST') && <OptoForecastIcon size={16} />}
                          {dec.type === 'RECALL' && <OptoRecallIcon size={16} />}
                          {!['LENSIQ_RECOMMENDATION', 'STOCK_ALERT', 'FORECAST', 'RECALL'].includes(dec.type) && <OptoPickAIIcon size={16} />}
                        </span>
                        <b style={{ fontSize: 14, color: 'var(--text-ink)' }}>{dec.title}</b>
                        {dec.badge && (
                          <span
                            className="badge"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: dec.badge.includes('OUT') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: dec.badge.includes('OUT') ? 'var(--status-bad)' : 'var(--status-warn)',
                              border: 'none',
                              padding: '1px 6px',
                            }}
                          >
                            {dec.badge}
                          </span>
                        )}
                      </div>
                      <div className="sub" style={{ marginTop: 3, color: 'var(--text-sub)', fontSize: 12.5 }}>
                        {dec.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`btn ${dec.type === 'STOCK_ALERT' ? 's' : 'p'} sm`}
                      onClick={() => onNavigate(dec.actionPage)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {dec.actionText}
                    </button>
                  </div>
                ))
              )}

              {/* Next / Previous Pagination if data exceeds limit of 5 */}
              {totalDecisionPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                  <span className="sub" style={{ fontSize: 12 }}>
                    Showing {(decisionsPage - 1) * DECISIONS_PER_PAGE + 1}–{Math.min(decisionsPage * DECISIONS_PER_PAGE, decisionsList.length)} of {decisionsList.length} items
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn g sm"
                      disabled={decisionsPage === 1}
                      onClick={() => setDecisionsPage((p) => Math.max(1, p - 1))}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="btn g sm"
                      disabled={decisionsPage >= totalDecisionPages}
                      onClick={() => setDecisionsPage((p) => Math.min(totalDecisionPages, p + 1))}
                      style={{ padding: '4px 10px', fontSize: 12 }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Staff Live Orders Table */
          <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <div className="ch" style={{ padding: '20px 22px 10px' }}>
              <h2>Recent Customer Orders</h2>
              <span className="r">
                <button type="button" className="btn g sm" onClick={() => onNavigate('sales')}>
                  View all orders <ArrowRight size={14} />
                </button>
              </span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th className="num">Balance (LKR)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders || [
                  { sale_number: 'ORD-2026-0104', customer_name: 'Fathima Nazeer', order_status: 'READY_FOR_COLLECTION', balance_amount: 4500 },
                  { sale_number: 'ORD-2026-0103', customer_name: 'A. R. Mohamed', order_status: 'DISPATCHED_TO_LAB', balance_amount: 8000 },
                  { sale_number: 'ORD-2026-0102', customer_name: 'K. Sivalingam', order_status: 'ORDER_PLACED', balance_amount: 0 },
                  { sale_number: 'ORD-2026-0101', customer_name: 'Zainab Begum', order_status: 'COLLECTED', balance_amount: 0 },
                ]).slice(0, 5).map((ord: any, idx: number) => (
                  <tr key={idx}>
                    <td><b>{ord.sale_number}</b></td>
                    <td>{ord.customer_name}</td>
                    <td>
                      <StatusBadge
                        variant={
                          ord.order_status === 'READY_FOR_COLLECTION' ? 'ok' :
                          ord.order_status === 'DISPATCHED_TO_LAB' ? 'warn' :
                          ord.order_status === 'COLLECTED' ? 'neutral' : 'info'
                        }
                        label={ord.order_status?.replace(/_/g, ' ') || 'PLACED'}
                      />
                    </td>
                    <td className="num">{formatLKR(ord.balance_amount)}</td>
                    <td>
                      <button type="button" className="btn s sm" onClick={() => onNavigate('sales')}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
