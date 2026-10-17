import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  Package,
  Users,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const ReportsPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-30');
  const [groupBy, setGroupBy] = useState<'Week' | 'Day' | 'Month'>('Week');

  const reportRows = [
    { period: '01–07 Sep 2026', invoices: 41, frames: 29, lenses: 52, discounts: 6200, revenue: 312400, balanceDue: 18500 },
    { period: '08–14 Sep 2026', invoices: 38, frames: 26, lenses: 47, discounts: 4900, revenue: 288750, balanceDue: 12000 },
    { period: '15–21 Sep 2026', invoices: 45, frames: 33, lenses: 58, discounts: 7350, revenue: 341900, balanceDue: 21300 },
    { period: '22–30 Sep 2026', invoices: 52, frames: 37, lenses: 66, discounts: 8100, revenue: 396200, balanceDue: 16800 },
  ];

  const totalInvoices = reportRows.reduce((acc, r) => acc + r.invoices, 0);
  const totalFrames = reportRows.reduce((acc, r) => acc + r.frames, 0);
  const totalLenses = reportRows.reduce((acc, r) => acc + r.lenses, 0);
  const totalDiscounts = reportRows.reduce((acc, r) => acc + r.discounts, 0);
  const totalRevenue = reportRows.reduce((acc, r) => acc + r.revenue, 0);
  const totalBalances = reportRows.reduce((acc, r) => acc + r.balanceDue, 0);

  const handleExport = (type: 'Excel' | 'PDF') => {
    if (type === 'Excel') {
      const headers = ['Period', 'Invoices', 'Frames Sold', 'Lenses Fitted', 'Discounts (LKR)', 'Revenue (LKR)', 'Balance Due (LKR)'];
      const rows = reportRows.map((r) => [
        `"${r.period}"`,
        r.invoices,
        r.frames,
        r.lenses,
        r.discounts,
        r.revenue,
        r.balanceDue,
      ]);
      const csvContent =
        'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `OptoPick_Financial_Report_${fromDate}_to_${toDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.print();
    }
  };

  return (
    <div className="content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 4 Summary KPI Cards Grid (Exact Jewel Look: Navy, Emerald, Espresso, Amethyst in both Light & Dark) */}
      <div className="row" style={{ gap: 16 }}>
        {/* Card 1: Sales & Revenue (Exact Sapphire Blue Look) */}
        <div
          className="card"
          style={{
            flex: 1,
            padding: '20px 22px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #021024 0%, #052659 50%, #173256 100%)',
            border: '1.5px solid rgba(125, 160, 202, 0.35)',
            boxShadow: '0 8px 24px rgba(2, 16, 36, 0.4), 0 0 16px rgba(125, 160, 202, 0.12)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontWeight: 700, fontSize: 13.5 }}>
              <DollarSign size={18} color="#7DA0CA" strokeWidth={2.4} />
              <span>Sales &amp; Revenue</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 9px',
                borderRadius: 9999,
                background: 'rgba(5, 38, 89, 0.85)',
                color: '#C1E8FF',
                border: '1px solid rgba(125, 160, 202, 0.3)',
                letterSpacing: '0.02em',
              }}
            >
              LKR
            </span>
          </div>
          <div className="big tabular-nums" style={{ fontSize: 34, fontWeight: 800, color: '#C1E8FF', margin: '8px 0 2px', lineHeight: 1.1 }}>
            1.34M
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#7DA0CA', opacity: 0.95 }}>
            LKR payments and receipts
          </div>
        </div>

        {/* Card 2: Stock Movements (Exact Emerald Green Look) */}
        <div
          className="card"
          style={{
            flex: 1,
            padding: '20px 22px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #051F20 0%, #0B2B26 50%, #163832 100%)',
            border: '1.5px solid rgba(142, 182, 155, 0.35)',
            boxShadow: '0 8px 24px rgba(5, 31, 32, 0.4), 0 0 16px rgba(142, 182, 155, 0.12)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontWeight: 700, fontSize: 13.5 }}>
              <Package size={18} color="#8EB69B" strokeWidth={2.4} />
              <span>Stock Movements</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 9px',
                borderRadius: 9999,
                background: 'rgba(11, 43, 38, 0.85)',
                color: '#DAF1DE',
                border: '1px solid rgba(142, 182, 155, 0.3)',
                letterSpacing: '0.02em',
              }}
            >
              Audit
            </span>
          </div>
          <div className="big tabular-nums" style={{ fontSize: 34, fontWeight: 800, color: '#DAF1DE', margin: '8px 0 2px', lineHeight: 1.1 }}>
            612
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8EB69B', opacity: 0.95 }}>
            Stock-in, sales &amp; returns
          </div>
        </div>

        {/* Card 3: Supplier Invoices (Exact Warm Mocha Look) */}
        <div
          className="card"
          style={{
            flex: 1,
            padding: '20px 22px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #291C0E 0%, #3d2716 50%, #4a301d 100%)',
            border: '1.5px solid rgba(190, 181, 169, 0.35)',
            boxShadow: '0 8px 24px rgba(41, 28, 14, 0.4), 0 0 16px rgba(190, 181, 169, 0.12)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontWeight: 700, fontSize: 13.5 }}>
              <Calendar size={18} color="#BEB5A9" strokeWidth={2.4} />
              <span>Supplier Invoices</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 9px',
                borderRadius: 9999,
                background: 'rgba(41, 28, 14, 0.85)',
                color: '#E1D4C2',
                border: '1px solid rgba(190, 181, 169, 0.3)',
                letterSpacing: '0.02em',
              }}
            >
              Vendors
            </span>
          </div>
          <div className="big tabular-nums" style={{ fontSize: 34, fontWeight: 800, color: '#E1D4C2', margin: '8px 0 2px', lineHeight: 1.1 }}>
            18
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#BEB5A9', opacity: 0.95 }}>
            Received from Colombo &amp; Kandy
          </div>
        </div>

        {/* Card 4: Patient Retention (Exact Royal Amethyst Look) */}
        <div
          className="card"
          style={{
            flex: 1,
            padding: '20px 22px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #2E1065 100%)',
            border: '1.5px solid rgba(196, 181, 253, 0.35)',
            boxShadow: '0 8px 24px rgba(46, 16, 101, 0.4), 0 0 16px rgba(196, 181, 253, 0.12)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FFFFFF', fontWeight: 700, fontSize: 13.5 }}>
              <Users size={18} color="#C4B5FD" strokeWidth={2.4} />
              <span>Patient Retention</span>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 9px',
                borderRadius: 9999,
                background: 'rgba(46, 16, 101, 0.85)',
                color: '#EDE9FE',
                border: '1px solid rgba(196, 181, 253, 0.3)',
                letterSpacing: '0.02em',
              }}
            >
              Recall
            </span>
          </div>
          <div className="big tabular-nums" style={{ fontSize: 34, fontWeight: 800, color: '#EDE9FE', margin: '8px 0 2px', lineHeight: 1.1 }}>
            71%
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#C4B5FD', opacity: 0.95 }}>
            Returning for 12-month review
          </div>
        </div>
      </div>

      {/* Main Breakdown Row */}
      <div className="row" style={{ flex: 1, minHeight: 0, gap: 16 }}>
        {/* Left Monthly Overview Card (310px) */}
        <div className="card" style={{ width: 310, display: 'flex', flexDirection: 'column', borderRadius: 16 }}>
          <h2 style={{ marginBottom: 14 }}>Monthly Summary</h2>

          <div style={{ paddingBottom: 14 }}>
            <span className="big tabular-nums" style={{ fontSize: 42, fontWeight: 800, color: 'var(--text-ink)' }}>
              1.34M
            </span>
            <div className="sub" style={{ fontSize: 13.5, marginTop: 4 }}>
              LKR net takings (1,339,250)
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
            <span className="big tabular-nums" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-ink)' }}>176</span>
            <span className="sub" style={{ textAlign: 'right' }}>Total Invoices</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
            <span className="big tabular-nums" style={{ fontSize: 22, fontWeight: 700, color: 'var(--status-warn)' }}>68,600</span>
            <span className="sub" style={{ textAlign: 'right' }}>LKR Balances Due</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
            <span className="big tabular-nums" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-ink)' }}>26,550</span>
            <span className="sub" style={{ textAlign: 'right' }}>LKR Discounts Given</span>
          </div>

          <div className="sub" style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontSize: 12 }}>
            Generated from immutable MySQL sales ledger for Indian Optician, Nintavur.
          </div>
        </div>

        {/* Right Data Table Card (flex: 1) */}
        <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden' }}>
          {/* Filter & Export Action Toolbar (Unified single row, clean baseline alignment) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              gap: 14,
              flexWrap: 'nowrap',
              background: 'var(--portal-bg)',
            }}
          >
            {/* Filter Inputs Group */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'nowrap' }}>
              <div className="f" style={{ margin: 0, width: 142 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>From Date</label>
                <div className="in" style={{ height: 36, padding: '0 8px' }}>
                  <Calendar size={14} color="var(--text-sub)" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>

              <div className="f" style={{ margin: 0, width: 142 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>To Date</label>
                <div className="in" style={{ height: 36, padding: '0 8px' }}>
                  <Calendar size={14} color="var(--text-sub)" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    style={{ fontSize: 12 }}
                  />
                </div>
              </div>

              <div className="f" style={{ margin: 0, width: 108 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>Group By</label>
                <div className="in" style={{ height: 36, padding: '0 8px' }}>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    style={{ fontSize: 12 }}
                  >
                    <option value="Week">Week</option>
                    <option value="Day">Day</option>
                    <option value="Month">Month</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dedicated Action Buttons Group (Refined Executive Navy/Slate Buttons) */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {/* Export Excel Button */}
              <button
                type="button"
                onClick={() => handleExport('Excel')}
                title="Download report data as Excel CSV spreadsheet"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  height: 36,
                  padding: '0 15px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isDark ? '#1E293B' : '#123B50',
                  color: '#FFFFFF',
                  border: isDark ? '1.5px solid #334155' : '1.5px solid #0F2D3D',
                  boxShadow: '0 2px 8px rgba(18, 59, 80, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(18, 59, 80, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(18, 59, 80, 0.2)';
                }}
              >
                <FileSpreadsheet size={15} color={isDark ? '#93C5FD' : '#7DD3FC'} />
                <span>Export Excel</span>
              </button>

              {/* Export PDF Button */}
              <button
                type="button"
                onClick={() => handleExport('PDF')}
                title="Print or export formatted PDF report"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  height: 36,
                  padding: '0 15px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: isDark ? '#1E293B' : '#123B50',
                  color: '#FFFFFF',
                  border: isDark ? '1.5px solid #334155' : '1.5px solid #0F2D3D',
                  boxShadow: '0 2px 8px rgba(18, 59, 80, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(18, 59, 80, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(18, 59, 80, 0.2)';
                }}
              >
                <FileText size={15} color={isDark ? '#93C5FD' : '#7DD3FC'} />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="num">Invoices</th>
                  <th className="num">Frames Sold</th>
                  <th className="num">Lenses Fitted</th>
                  <th className="num">Discounts (LKR)</th>
                  <th className="num">Revenue (LKR)</th>
                  <th className="num">Balance Due (LKR)</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((r, i) => (
                  <tr key={i}>
                    <td><b>{r.period}</b></td>
                    <td className="num">{r.invoices}</td>
                    <td className="num">{r.frames}</td>
                    <td className="num">{r.lenses}</td>
                    <td className="num">{r.discounts.toLocaleString('en-US')}</td>
                    <td className="num"><b>{r.revenue.toLocaleString('en-US')}</b></td>
                    <td className="num" style={{ color: r.balanceDue > 0 ? 'var(--status-warn)' : 'inherit', fontWeight: r.balanceDue > 0 ? 700 : 'inherit' }}>
                      {r.balanceDue.toLocaleString('en-US')}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr style={{ backgroundColor: 'var(--portal-bg)', fontWeight: 700 }}>
                  <td><b>Total</b></td>
                  <td className="num"><b>{totalInvoices}</b></td>
                  <td className="num"><b>{totalFrames}</b></td>
                  <td className="num"><b>{totalLenses}</b></td>
                  <td className="num"><b>{totalDiscounts.toLocaleString('en-US')}</b></td>
                  <td className="num" style={{ color: 'var(--status-ok)' }}>
                    <b>LKR {totalRevenue.toLocaleString('en-US')}</b>
                  </td>
                  <td className="num" style={{ color: 'var(--status-warn)' }}>
                    <b>LKR {totalBalances.toLocaleString('en-US')}</b>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
