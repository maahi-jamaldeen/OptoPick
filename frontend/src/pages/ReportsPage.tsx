import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, Package, Users, DollarSign, Filter } from 'lucide-react';

export const ReportsPage: React.FC = () => {
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
    alert(`Generating ${type} report for Indian Optician, Nintavur... (Period: ${fromDate} to ${toDate})`);
  };

  return (
    <div className="content">
      {/* 4 Summary Cards Grid */}
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <div
          className="card"
          style={{
            flex: 1,
            padding: '18px 20px',
            backgroundColor: 'var(--primary-action)',
            color: 'var(--primary-action-text)',
            border: 'none',
          }}
        >
          <div className="big tabular-nums" style={{ fontSize: 32, color: 'var(--primary-action-text)' }}>
            1.34M
          </div>
          <b style={{ fontSize: 14.5, display: 'block', marginTop: 4 }}>Sales &amp; Revenue</b>
          <div style={{ fontSize: 12.5, opacity: 0.85 }}>LKR payments and receipts</div>
        </div>

        <div className="card" style={{ flex: 1, padding: '18px 20px' }}>
          <div className="big tabular-nums" style={{ fontSize: 32, color: 'var(--text-ink)' }}>
            612
          </div>
          <b style={{ fontSize: 14.5, display: 'block', marginTop: 4 }}>Stock Movements</b>
          <div className="sub" style={{ fontSize: 12.5 }}>Stock-in, sales &amp; returns</div>
        </div>

        <div className="card" style={{ flex: 1, padding: '18px 20px' }}>
          <div className="big tabular-nums" style={{ fontSize: 32, color: 'var(--text-ink)' }}>
            18
          </div>
          <b style={{ fontSize: 14.5, display: 'block', marginTop: 4 }}>Supplier Invoices</b>
          <div className="sub" style={{ fontSize: 12.5 }}>Received from Colombo &amp; Kandy</div>
        </div>

        <div className="card" style={{ flex: 1, padding: '18px 20px' }}>
          <div className="big tabular-nums" style={{ fontSize: 32, color: 'var(--status-ok)' }}>
            71%
          </div>
          <b style={{ fontSize: 14.5, display: 'block', marginTop: 4 }}>Patient Retention</b>
          <div className="sub" style={{ fontSize: 12.5 }}>Returning for 12-month review</div>
        </div>
      </div>

      {/* Main Breakdown Row */}
      <div className="row" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Monthly Overview Card (300px) */}
        <div className="card" style={{ width: 310, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ marginBottom: 14 }}>Monthly Summary</h2>

          <div style={{ paddingBottom: 14 }}>
            <span className="big tabular-nums" style={{ fontSize: 42, color: 'var(--text-ink)' }}>
              1.34M
            </span>
            <div className="sub" style={{ fontSize: 13.5, marginTop: 4 }}>
              LKR net takings (1,339,250)
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
            <span className="big tabular-nums" style={{ fontSize: 26, color: 'var(--text-ink)' }}>176</span>
            <span className="sub" style={{ textAlign: 'right' }}>Total Invoices</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
            <span className="big tabular-nums" style={{ fontSize: 22, color: 'var(--status-warn)' }}>68,600</span>
            <span className="sub" style={{ textAlign: 'right' }}>LKR Balances Due</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
            <span className="big tabular-nums" style={{ fontSize: 18, color: 'var(--text-ink)' }}>26,550</span>
            <span className="sub" style={{ textAlign: 'right' }}>LKR Discounts Given</span>
          </div>

          <div className="sub" style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontSize: 12 }}>
            Generated from immutable MySQL sales ledger for Indian Optician, Nintavur.
          </div>
        </div>

        {/* Right Data Table Card (flex: 1) */}
        <div className="card" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', padding: '20px 22px', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
            <div className="f" style={{ width: 170 }}>
              <label>From Date</label>
              <div className="in">
                <Calendar size={16} color="var(--text-sub)" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
            </div>

            <div className="f" style={{ width: 170 }}>
              <label>To Date</label>
              <div className="in">
                <Calendar size={16} color="var(--text-sub)" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            <div className="f" style={{ width: 130 }}>
              <label>Group By</label>
              <div className="in">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                >
                  <option value="Week">Week</option>
                  <option value="Day">Day</option>
                  <option value="Month">Month</option>
                </select>
              </div>
            </div>

            {/* Export Buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="btn s sm"
                onClick={() => handleExport('Excel')}
              >
                <Download size={14} />
                <span>Export Excel</span>
              </button>
              <button
                type="button"
                className="btn p sm"
                onClick={() => handleExport('PDF')}
              >
                <Download size={14} />
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
                    <td className="num" style={{ color: r.balanceDue > 0 ? 'var(--status-warn)' : 'inherit' }}>
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
