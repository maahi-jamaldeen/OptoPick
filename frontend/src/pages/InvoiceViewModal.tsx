import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Printer, Send, X } from 'lucide-react';

interface InvoiceViewModalProps {
  saleId: number;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ saleId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSale() {
      try {
        setLoading(true);
        const res: any = await api.get(`/sales/${saleId}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSale();
  }, [saleId]);

  if (loading || !data) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(18, 59, 80, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          <div className="sub">Preparing official optical invoice...</div>
        </div>
      </div>
    );
  }

  const { sale, items, payments, prescription } = data;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(18, 59, 80, 0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
        }}
      >
        {/* Official Printable Invoice */}
        <div
          className="card"
          id="printable-optical-invoice"
          style={{
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            background: 'var(--rf-card-bg)',
            overflowY: 'auto',
          }}
        >
          {/* Clinic Brand & Invoice Number with Close button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 className="serif" style={{ fontSize: 22, margin: 0 }}>Indian Optician</h2>
              <div className="sub">No 67/1, Main Street, Nintavur – 13</div>
              <div className="sub" style={{ fontSize: 11 }}>Eastern Province · Hotline: +94 67 225 0123</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, fontWeight: 800, letterSpacing: '0.05em' }}>
                  INVOICE
                </div>
                <div className="sub" style={{ fontWeight: 600 }}>{sale.sale_number}</div>
                <div className="sub" style={{ fontSize: 12 }}>
                  {new Date(sale.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                  <StatusBadge
                    status={sale.payment_status === 'PAID' ? 'ACTIVE' : 'WARNING'}
                    label={sale.payment_status}
                  />
                  <StatusBadge
                    status="INFO"
                    label={sale.order_status?.replace(/_/g, ' ')}
                  />
                </div>
              </div>
              <button
                type="button"
                className="btn g sm"
                onClick={onClose}
                title="Close"
                style={{ padding: 4, borderRadius: 8 }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <hr />

          {/* Billed To / Rx / Staff Metadata */}
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div className="sub" style={{ fontSize: 12 }}>Billed to</div>
              <div style={{ fontWeight: 700 }}>{sale.customer_name}</div>
              <div className="sub tabular-nums">{sale.phone_number}</div>
            </div>
            {prescription && (
              <div>
                <div className="sub" style={{ fontSize: 12 }}>Prescription Linked</div>
                <div style={{ fontWeight: 700 }}>
                  {new Date(prescription.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div className="sub">Examined by Optometrist</div>
              </div>
            )}
            <div>
              <div className="sub" style={{ fontSize: 12 }}>Served by</div>
              <div style={{ fontWeight: 700 }}>{sale.processed_by_name || 'Front Desk Staff'}</div>
              <div className="sub">Optical Dispenser</div>
            </div>
          </div>

          {/* If Prescription Linked: Show Refraction Table */}
          {prescription && (
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--rf-glass-bg)', border: '1px solid var(--rf-border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Prescribed Refraction (PD: {prescription.pd} mm)
              </div>
              <table className="rx" style={{ width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Eye</th>
                    <th>SPH</th>
                    <th>CYL</th>
                    <th>AXIS</th>
                    <th>ADD</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>OD (Right)</b></td>
                    <td className="num">{prescription.od_sph > 0 ? `+${prescription.od_sph}` : prescription.od_sph}</td>
                    <td className="num">{prescription.od_cyl}</td>
                    <td className="num">{prescription.od_axis}°</td>
                    <td className="num">{prescription.od_add ? `+${prescription.od_add}` : '—'}</td>
                  </tr>
                  <tr>
                    <td><b>OS (Left)</b></td>
                    <td className="num">{prescription.os_sph > 0 ? `+${prescription.os_sph}` : prescription.os_sph}</td>
                    <td className="num">{prescription.os_cyl}</td>
                    <td className="num">{prescription.os_axis}°</td>
                    <td className="num">{prescription.os_add ? `+${prescription.os_add}` : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Line Items Table */}
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th className="num">Qty</th>
                <th className="num">Unit Price (LKR)</th>
                <th className="num">Amount (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.item_name}</b>
                    <span className="sub" style={{ display: 'block', fontSize: 11 }}>{item.item_type}</span>
                  </td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">{Number(item.unit_price).toLocaleString()}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{Number(item.total_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Calculation Summary */}
          <div style={{ marginLeft: 'auto', width: 300, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            <div className="kv">
              <span>Subtotal</span>
              <b className="num">{Number(sale.subtotal).toLocaleString()}</b>
            </div>
            {Number(sale.discount_amount) > 0 && (
              <div className="kv" style={{ color: 'var(--rf-badge-bad-text)' }}>
                <span>Discount</span>
                <b className="num">− {Number(sale.discount_amount).toLocaleString()}</b>
              </div>
            )}
            <div className="kv" style={{ fontSize: 16, borderTop: '1px solid var(--rf-border)', paddingTop: 6 }}>
              <span>Total Payable</span>
              <b className="num" style={{ color: 'var(--rf-primary)' }}>LKR {Number(sale.total_amount).toLocaleString()}</b>
            </div>
            <div className="kv">
              <span>Advance Paid</span>
              <b className="num" style={{ color: 'var(--rf-badge-ok-text)' }}>{Number(sale.paid_amount).toLocaleString()}</b>
            </div>
            <div className="kv" style={{ fontSize: 14 }}>
              <span>Balance Due</span>
              <b className="num" style={{ color: Number(sale.balance_amount) > 0 ? 'var(--rf-badge-warn-text)' : 'var(--rf-badge-ok-text)' }}>
                LKR {Number(sale.balance_amount).toLocaleString()}
              </b>
            </div>
          </div>

          {/* Payment Receipts History if available */}
          {payments && payments.length > 0 && (
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--portal-bg)', border: '1px solid var(--border-color)', fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Payment Allocation History</div>
              {payments.map((p: any) => (
                <div key={p.id} className="kv" style={{ padding: '2px 0' }}>
                  <span>{p.payment_number} ({p.payment_method} · {p.payment_type}) - {new Date(p.created_at).toLocaleDateString()}</span>
                  <b className="num" style={{ color: 'var(--rf-badge-ok-text)' }}>LKR {Number(p.amount).toLocaleString()}</b>
                </div>
              ))}
            </div>
          )}

          {/* Invoice Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--rf-border)' }}>
            <button
              type="button"
              className="btn p"
              onClick={() => window.print()}
            >
              <Printer size={16} /> Print Invoice
            </button>
            <button
              type="button"
              className="btn s"
              onClick={() => alert(`SMS notification queued for ${sale.customer_name} (${sale.phone_number})`)}
            >
              <Send size={16} /> Send by SMS
            </button>
            <button
              type="button"
              className="btn g"
              style={{ marginLeft: 'auto' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
