import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Sale } from '../types';
import { InvoiceViewModal } from './InvoiceViewModal';
import { StatusBadge } from '../components/Common/StatusBadge';
import {
  Printer,
  DollarSign,
  Plus,
  Search,
  Filter,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';

interface SalesOrdersPageProps {
  onNewSale: () => void;
}

export const SalesOrdersPage: React.FC<SalesOrdersPageProps> = ({ onNewSale }) => {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Invoice Modal
  const [activeInvoiceSaleId, setActiveInvoiceSaleId] = useState<number | null>(null);

  // Balance Payment Modal
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/sales?order_status=${statusFilter}` : '/sales';
      const res = await api.get<{ sales: Sale[]; status_counts?: Record<string, number> }>(url);
      setSales(res.sales || []);
      if (res.status_counts) {
        setStatusCounts(res.status_counts);
      }
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [statusFilter]);

  const handleStatusChange = async (saleId: number, newStatus: string) => {
    try {
      await api.patch(`/sales/${saleId}/order-status`, { order_status: newStatus });
      fetchSales();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentSale) return;
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }
    if (amt > Number(paymentSale.balance_amount)) {
      setPaymentError(`Payment amount cannot exceed the balance due of LKR ${Number(paymentSale.balance_amount).toLocaleString('en-US')}.`);
      return;
    }

    setPaymentError(null);
    setSubmittingPayment(true);

    try {
      await api.post(`/sales/${paymentSale.id}/payments`, {
        amount: amt,
        payment_method: paymentMethod,
        payment_type: amt >= Number(paymentSale.balance_amount) ? 'BALANCE' : 'ADVANCE',
      });
      const updatedSaleId = paymentSale.id;
      setPaymentSale(null);
      await fetchSales();
      setActiveInvoiceSaleId(updatedSaleId);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment submission failed.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.sale_number?.toLowerCase().includes(q) ||
      s.customer_name?.toLowerCase().includes(q) ||
      s.phone_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Action Bar & Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div className="tabs" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`tab ${statusFilter === '' ? 'on' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            All Orders ({statusCounts.ALL ?? sales.length})
          </button>
          <button
            type="button"
            className={`tab ${statusFilter === 'ORDER_PLACED' ? 'on' : ''}`}
            onClick={() => setStatusFilter('ORDER_PLACED')}
          >
            Order Placed ({statusCounts.ORDER_PLACED ?? 0})
          </button>
          <button
            type="button"
            className={`tab ${statusFilter === 'DISPATCHED_TO_LAB' ? 'on' : ''}`}
            onClick={() => setStatusFilter('DISPATCHED_TO_LAB')}
          >
            At Glazing Lab ({statusCounts.DISPATCHED_TO_LAB ?? 0})
          </button>
          <button
            type="button"
            className={`tab ${statusFilter === 'RECEIVED_FROM_LAB' ? 'on' : ''}`}
            onClick={() => setStatusFilter('RECEIVED_FROM_LAB')}
          >
            Received from Lab ({statusCounts.RECEIVED_FROM_LAB ?? 0})
          </button>
          <button
            type="button"
            className={`tab ${statusFilter === 'READY_FOR_COLLECTION' ? 'on' : ''}`}
            onClick={() => setStatusFilter('READY_FOR_COLLECTION')}
          >
            Ready for Collection ({statusCounts.READY_FOR_COLLECTION ?? 0})
          </button>
          <button
            type="button"
            className={`tab ${statusFilter === 'COLLECTED' ? 'on' : ''}`}
            onClick={() => setStatusFilter('COLLECTED')}
          >
            Collected ({statusCounts.COLLECTED ?? 0})
          </button>
        </div>

        <button type="button" className="btn p" onClick={onNewSale}>
          <Plus size={16} /> New Sale / Dispense
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="in" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={16} color="var(--rf-text-muted)" />
          <input
            type="text"
            placeholder="Search invoice number, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13, color: 'inherit' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--rf-text-muted)' }}>
          <div className="sub">Retrieving optical dispensing orders ledger...</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ch" style={{ padding: '18px 20px 10px', margin: 0 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Invoicing & Order Tracking</h2>
              <div className="sub">Live status tracking across fitting workshop, glazing lab, and front-desk collection</div>
            </div>
            <div className="r sub">
              Showing {filteredSales.length} of {sales.length} orders
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th className="num">Total (LKR)</th>
                  <th className="num">Paid (LKR)</th>
                  <th className="num">Balance (LKR)</th>
                  <th>Payment</th>
                  <th>Workshop Stage</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 36, color: 'var(--rf-text-muted)' }}>
                      No optical dispensing orders match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => setActiveInvoiceSaleId(s.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--rf-primary)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                            textAlign: 'left',
                            fontFamily: 'inherit'
                          }}
                        >
                          {s.sale_number}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.customer_name}</div>
                        <div className="sub" style={{ fontSize: 12 }}>{s.phone_number}</div>
                      </td>
                      <td className="num" style={{ fontWeight: 600 }}>
                        {Number(s.total_amount).toLocaleString()}
                      </td>
                      <td className="num" style={{ color: 'var(--rf-badge-ok-text)' }}>
                        {Number(s.paid_amount).toLocaleString()}
                      </td>
                      <td className="num" style={{ fontWeight: 700, color: Number(s.balance_amount) > 0 ? 'var(--rf-badge-warn-text)' : 'inherit' }}>
                        {Number(s.balance_amount).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge
                          status={s.payment_status === 'PAID' ? 'ACTIVE' : 'WARNING'}
                          label={s.payment_status}
                        />
                      </td>
                      <td>
                        <select
                          className="in sel"
                          style={{ height: 34, padding: '0 8px', fontSize: 12, minWidth: 160 }}
                          value={s.order_status}
                          onChange={(e) => handleStatusChange(s.id, e.target.value)}
                        >
                          <option value="ORDER_PLACED">Order Placed</option>
                          <option value="DISPATCHED_TO_LAB">At Glazing Lab</option>
                          <option value="RECEIVED_FROM_LAB">Received from Lab</option>
                          <option value="READY_FOR_COLLECTION">Ready for Collection</option>
                          <option value="COLLECTED">Collected</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td className="sub" style={{ fontSize: 12 }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            className="btn s sm"
                            title="Print Tax Invoice & Receipt"
                            onClick={() => setActiveInvoiceSaleId(s.id)}
                          >
                            <Printer size={13} /> Print
                          </button>
                          {Number(s.balance_amount) > 0 && (
                            <button
                              type="button"
                              className="btn p sm"
                              title="Collect Remaining Balance from Customer"
                              onClick={() => {
                                setPaymentSale(s);
                                setPaymentAmount(String(s.balance_amount));
                                setPaymentError(null);
                              }}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              Collect Balance
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {activeInvoiceSaleId && (
        <InvoiceViewModal
          saleId={activeInvoiceSaleId}
          onClose={() => setActiveInvoiceSaleId(null)}
        />
      )}

      {/* Balance Payment Modal */}
      {paymentSale && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 59, 80, 0.55)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: 20,
          }}
        >
          <div className="card" style={{ width: 480, padding: 26, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.35)' }}>
            <div className="ch" style={{ margin: 0 }}>
              <div>
                <h2 style={{ fontSize: 18, margin: 0 }}>Collect Remaining Payment</h2>
                <div className="sub" style={{ fontSize: 12 }}>Settle customer outstanding balance</div>
              </div>
              <span className="r">
                <button
                  type="button"
                  className="btn g sm"
                  onClick={() => setPaymentSale(null)}
                  style={{ border: 'none', padding: 4, borderRadius: 8 }}
                >
                  ✕
                </button>
              </span>
            </div>

            {paymentError && (
              <div className="note n-bad">
                <AlertCircle size={16} />
                <span>{paymentError}</span>
              </div>
            )}

            <div style={{ padding: 14, borderRadius: 12, background: 'var(--portal-bg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="kv" style={{ fontSize: 13 }}>
                <span className="sub">Order Number:</span>
                <b>{paymentSale.sale_number}</b>
              </div>
              <div className="kv" style={{ fontSize: 13 }}>
                <span className="sub">Patient / Customer:</span>
                <span style={{ fontWeight: 600 }}>{paymentSale.customer_name} ({paymentSale.phone_number})</span>
              </div>
              <div className="kv" style={{ fontSize: 13 }}>
                <span className="sub">Total Order Amount:</span>
                <span className="tabular-nums">LKR {Number(paymentSale.total_amount).toLocaleString('en-US')}</span>
              </div>
              <div className="kv" style={{ fontSize: 13 }}>
                <span className="sub">Previously Paid:</span>
                <span className="tabular-nums" style={{ color: 'var(--rf-badge-ok-text)' }}>LKR {Number(paymentSale.paid_amount).toLocaleString('en-US')}</span>
              </div>
              <div className="kv" style={{ fontSize: 15, borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
                <span style={{ fontWeight: 700 }}>Current Balance Due:</span>
                <b className="tabular-nums" style={{ color: 'var(--rf-badge-warn-text)' }}>
                  LKR {Number(paymentSale.balance_amount).toLocaleString('en-US')}
                </b>
              </div>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="f">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ margin: 0 }}>Payment Amount to Collect (LKR) <span className="req">*</span></label>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(paymentSale.balance_amount))}
                    className="badge"
                    style={{ cursor: 'pointer', background: 'var(--portal-bg)', color: 'var(--rf-primary)', fontSize: 11, border: '1px solid var(--rf-primary)' }}
                  >
                    Full Balance
                  </button>
                </div>
                <div className="in foc">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={Number(paymentSale.balance_amount)}
                    className="num"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 17, fontWeight: 700, color: 'var(--rf-badge-ok-text)' }}
                  />
                  <span className="sub">LKR</span>
                </div>
                {/* Remaining balance preview */}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Remaining balance after this collection:{' '}
                  <b style={{ color: Math.max(0, Number(paymentSale.balance_amount) - (parseFloat(paymentAmount) || 0)) === 0 ? 'var(--status-ok)' : 'var(--status-warn)' }}>
                    LKR {Math.max(0, Number(paymentSale.balance_amount) - (parseFloat(paymentAmount) || 0)).toLocaleString('en-US')}
                  </b>
                  {Math.max(0, Number(paymentSale.balance_amount) - (parseFloat(paymentAmount) || 0)) === 0 && (
                    <span style={{ color: 'var(--status-ok)', marginLeft: 6, fontWeight: 600 }}>✓ Order will be fully PAID</span>
                  )}
                </div>
              </div>

              <div className="f">
                <label>Payment Method</label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: 'var(--portal-bg)',
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-ok)' }} />
                  <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-ink)' }}>
                    Direct Payment (In-Store Counter Settlement)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn s" onClick={() => setPaymentSale(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn p" disabled={submittingPayment}>
                  {submittingPayment ? 'Recording...' : 'Record Payment & View Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
