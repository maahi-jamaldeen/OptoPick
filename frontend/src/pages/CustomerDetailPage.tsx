import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Customer, Sale, Communication } from '../types';
import { DuochromeCompare } from '../components/Common/DuochromeCompare';
import { StatusBadge } from '../components/Common/StatusBadge';
import {
  ArrowLeft,
  Eye,
  ShoppingCart,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  User
} from 'lucide-react';

interface CustomerDetailPageProps {
  customerId: number;
  onBack: () => void;
  onNewExam: (customerId: number) => void;
  onNewSale: (customerId: number) => void;
  onLaunchLensIQ: (customerId: number, prescriptionId?: number) => void;
}

export const CustomerDetailPage: React.FC<CustomerDetailPageProps> = ({
  customerId,
  onBack,
  onNewExam,
  onNewSale,
  onLaunchLensIQ,
}) => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<{
    customer: Customer;
    examinations: any[];
    sales: Sale[];
    communications: Communication[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rx' | 'sales' | 'comms' | 'history'>('rx');

  useEffect(() => {
    async function fetchCustomerDetails() {
      try {
        setLoading(true);
        const res = await api.get<{
          customer: Customer;
          examinations: any[];
          sales: Sale[];
          communications: Communication[];
        }>(`/customers/${customerId}`);
        setData(res);
      } catch (err) {
        console.error('Failed to load customer details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomerDetails();
  }, [customerId]);

  if (loading) {
    return (
      <div className="content" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="sub">Retrieving patient clinical record...</div>
      </div>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="content">
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <b>Customer record not found.</b>
          <button type="button" className="btn s sm" style={{ marginTop: 14 }} onClick={onBack}>
            Return to Registry
          </button>
        </div>
      </div>
    );
  }

  const { customer, examinations = [], sales = [], communications = [], profile_history = [] } = (data as any);

  // Format Rx objects for Duochrome comparison
  const latestExam = examinations[0];
  const previousExam = examinations[1];

  const getExamRx = (exam: any) => {
    if (!exam) return null;
    const rx = exam.prescription || exam;
    const od_sph = rx.od_sph !== undefined && rx.od_sph !== null ? rx.od_sph : exam.od_sph;
    if (od_sph === undefined || od_sph === null) return null;
    return {
      date: new Date(exam.exam_date || exam.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      od_sph: Number(od_sph),
      od_cyl: Number(rx.od_cyl ?? exam.od_cyl ?? 0),
      os_sph: Number(rx.os_sph ?? exam.os_sph ?? 0),
      os_cyl: Number(rx.os_cyl ?? exam.os_cyl ?? 0),
      pd: Number(rx.pd ?? exam.pd ?? 63),
    };
  };

  const nowRx = getExamRx(latestExam);
  const beforeRx = getExamRx(previousExam);

  const formatDiopter = (val: any) => {
    if (val === undefined || val === null || val === '') return '—';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return '—';
    return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
  };

  return (
    <div className="content">
      {/* Top Patient Summary Bar */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              className="iconbtn"
              onClick={onBack}
              title="Return to Customer Directory"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 24, margin: 0 }}>{customer.full_name}</h1>
                <StatusBadge variant="info" label={customer.customer_code} />
              </div>
              <div className="sub" style={{ display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' }}>
                <span><Phone size={13} className="me-1" />{customer.phone_number}</span>
                {customer.email && <span><Mail size={13} className="me-1" />{customer.email}</span>}
                {customer.occupation && <span><Briefcase size={13} className="me-1" />{customer.occupation}</span>}
                {customer.age && <span>{customer.age} yrs · {customer.gender}</span>}
              </div>
            </div>
          </div>

          {/* Quick Clinical Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {isAdmin && (
              <button
                type="button"
                className="btn s"
                onClick={() => onNewExam(customer.id)}
              >
                <Eye size={16} />
                <span>New Examination</span>
              </button>
            )}
            <button
              type="button"
              className="btn a"
              onClick={() => onLaunchLensIQ(customer.id, latestExam?.prescription?.id)}
            >
              <Sparkles size={16} />
              <span>Launch LensIQ</span>
            </button>
            <button
              type="button"
              className="btn p"
              onClick={() => onNewSale(customer.id)}
            >
              <ShoppingCart size={16} />
              <span>Create Dispensing Sale</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'rx' ? 'on' : ''}`}
          onClick={() => setActiveTab('rx')}
        >
          Prescription History ({examinations.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'sales' ? 'on' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Spectacle Orders &amp; Invoices ({sales.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'comms' ? 'on' : ''}`}
          onClick={() => setActiveTab('comms')}
        >
          Customer Communications ({communications.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'history' ? 'on' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Profile &amp; Lifestyle Evolution ({profile_history.length})
        </button>
      </div>

      {/* Tab 1: Refraction History & Duochrome Comparison */}
      {activeTab === 'rx' && (
        <div className="col" style={{ gap: 18 }}>
          {/* Signature Duochrome Comparison Panel */}
          {examinations.length > 0 && (
            <div className="card" style={{ padding: '20px 22px' }}>
              <div className="ch" style={{ marginBottom: 12 }}>
                <h2>Duochrome Refraction Progression</h2>
                <span className="sub r">Side-by-side Before/Now clinical comparison</span>
              </div>
              <DuochromeCompare before={beforeRx} now={nowRx} />
            </div>
          )}

          {/* Chronological Examinations List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ch" style={{ padding: '18px 22px 10px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
              <h3 style={{ fontSize: 16 }}>Chronological Eye Examination Log</h3>
              <span className="sub r">Preserved immutably per optical healthcare regulations</span>
            </div>

            {examinations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
                No eye examinations recorded yet for this customer.
                {isAdmin && (
                  <div style={{ marginTop: 12 }}>
                    <button type="button" className="btn p sm" onClick={() => onNewExam(customer.id)}>
                      Conduct First Refraction Exam
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="rx">
                  <thead>
                    <tr>
                      <th>Exam Date</th>
                      <th>Eye</th>
                      <th>SPH (D)</th>
                      <th>CYL (D)</th>
                      <th>Axis (°)</th>
                      <th>ADD (D)</th>
                      <th>PD (mm)</th>
                      <th>Clinician</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examinations.map((exam: any) => {
                      const rx = exam.prescription || exam;
                      const dateStr = new Date(exam.exam_date || exam.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      return (
                        <React.Fragment key={exam.id || exam.exam_id}>
                          {/* Right Eye (OD) */}
                          <tr>
                            <td rowSpan={2} style={{ verticalAlign: 'top', borderRight: '1px solid var(--border-subtle)' }}>
                              <b>{dateStr}</b>
                              {exam.clinical_notes && (
                                <div className="sub" style={{ fontSize: 11.5, marginTop: 4, maxWidth: 160 }}>
                                  {exam.clinical_notes}
                                </div>
                              )}
                            </td>
                            <td><b style={{ color: 'var(--primary-action)' }}>OD (Right)</b></td>
                            <td className="tabular-nums"><b>{formatDiopter(rx?.od_sph)}</b></td>
                            <td className="tabular-nums">{formatDiopter(rx?.od_cyl)}</td>
                            <td className="tabular-nums">{rx?.od_axis || 0}°</td>
                            <td className="tabular-nums">{rx?.od_add ? formatDiopter(rx.od_add) : '—'}</td>
                            <td rowSpan={2} className="tabular-nums" style={{ verticalAlign: 'middle', borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                              <b>{rx?.pd || '—'}</b>
                            </td>
                            <td rowSpan={2} style={{ verticalAlign: 'middle', borderRight: '1px solid var(--border-subtle)' }}>
                              {exam.examiner_name || 'Mr. Musthaq'}
                            </td>
                            <td rowSpan={2} style={{ verticalAlign: 'middle' }}>
                              {rx?.is_latest ? (
                                <StatusBadge variant="ok" label="Active Rx" icon="check" />
                              ) : (
                                <StatusBadge variant="neutral" label="Historical" />
                              )}
                            </td>
                          </tr>

                          {/* Left Eye (OS) */}
                          <tr>
                            <td><b style={{ color: 'var(--status-info)' }}>OS (Left)</b></td>
                            <td className="tabular-nums"><b>{formatDiopter(rx?.os_sph)}</b></td>
                            <td className="tabular-nums">{formatDiopter(rx?.os_cyl)}</td>
                            <td className="tabular-nums">{rx?.os_axis || 0}°</td>
                            <td className="tabular-nums">{rx?.os_add ? formatDiopter(rx.os_add) : '—'}</td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Sales & Spectacle Orders */}
      {activeTab === 'sales' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ch" style={{ padding: '18px 22px 10px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
            <h3 style={{ fontSize: 16 }}>Optical Spectacle Orders &amp; Receipts</h3>
            <span className="sub r">{sales.length} transactions recorded</span>
          </div>

          {sales.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
              No sales orders recorded yet for this patient.
              <div style={{ marginTop: 12 }}>
                <button type="button" className="btn p sm" onClick={() => onNewSale(customer.id)}>
                  Create First Sale
                </button>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Total (LKR)</th>
                    <th>Paid (LKR)</th>
                    <th>Balance (LKR)</th>
                    <th>Workshop Lifecycle</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s: any) => (
                    <tr key={s.id}>
                      <td><b>{s.sale_number}</b></td>
                      <td className="sub">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="num"><b>{parseFloat(s.total_amount as any).toLocaleString('en-US')}</b></td>
                      <td className="num">{parseFloat(s.paid_amount as any).toLocaleString('en-US')}</td>
                      <td className="num" style={{ color: parseFloat(s.balance_amount as any) > 0 ? 'var(--status-warn)' : 'inherit' }}>
                        {parseFloat(s.balance_amount as any).toLocaleString('en-US')}
                      </td>
                      <td>
                        <StatusBadge
                          variant={
                            s.order_status === 'COLLECTED' ? 'neutral' :
                            s.order_status === 'READY_FOR_COLLECTION' ? 'ok' :
                            s.order_status === 'DISPATCHED_TO_LAB' ? 'warn' : 'info'
                          }
                          label={s.order_status?.replace(/_/g, ' ') || 'ORDER PLACED'}
                        />
                      </td>
                      <td>
                        <StatusBadge
                          variant={s.payment_status === 'PAID' ? 'ok' : 'warn'}
                          label={s.payment_status || 'PENDING'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Customer Communications */}
      {activeTab === 'comms' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ch" style={{ padding: '18px 22px 10px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
            <h3 style={{ fontSize: 16 }}>Patient Communication History</h3>
            <span className="sub r">Order notices &amp; recall messages</span>
          </div>

          {communications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
              No messages dispatched to this patient yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Channel</th>
                    <th>Message Draft</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {communications.map((c: any) => (
                    <tr key={c.id}>
                      <td className="sub" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(c.created_at).toLocaleString()}
                      </td>
                      <td><b>{c.communication_type?.replace(/_/g, ' ')}</b></td>
                      <td><span className="badge b-info">{c.channel}</span></td>
                      <td style={{ maxWidth: 360, fontSize: 13 }}>{c.message_body}</td>
                      <td>
                        <StatusBadge
                          variant={c.status === 'SENT' ? 'ok' : 'warn'}
                          label={c.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Profile Evolution & Demographic History */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ch" style={{ padding: '18px 22px 10px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
            <div>
              <h3 style={{ fontSize: 16, margin: 0 }}>Patient Profile Evolution &amp; Demographic Archive</h3>
              <div className="sub" style={{ fontSize: 12.5, marginTop: 2 }}>
                Audit snapshots of previously recorded contact numbers, occupations, ages, and lifestyle habits preserved during patient return visits.
              </div>
            </div>
            <span className="badge" style={{ background: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: 11 }}>
              {profile_history.length} Historical Snapshots
            </span>
          </div>

          {profile_history.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
              No previous demographic revisions on record. This patient is operating on their initial registration profile.
            </div>
          ) : (
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {profile_history.map((h: any, idx: number) => (
                <div
                  key={h.id || idx}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: 11 }}>
                        Snapshot #{profile_history.length - idx}
                      </span>
                      <b style={{ fontSize: 13.5, color: '#0F172A' }}>
                        Archived on {new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(h.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </b>
                    </div>
                    <span className="sub" style={{ fontSize: 12 }}>
                      Updated by: <b>{h.changed_by_name || 'Staff'}</b> &bull; {h.change_reason || 'Returning patient demographic update'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11.5, fontWeight: 600 }}>PREVIOUS PHONE:</span>
                      <b>{h.previous_phone_number || '—'}</b>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11.5, fontWeight: 600 }}>PREVIOUS AGE:</span>
                      <b>{h.previous_age ? `${h.previous_age} Yrs` : '—'}</b>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11.5, fontWeight: 600 }}>PREVIOUS OCCUPATION:</span>
                      <b>{h.previous_occupation || '—'}</b>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11.5, fontWeight: 600 }}>PREVIOUS ADDRESS:</span>
                      <b>{h.previous_address || '—'}</b>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11.5, fontWeight: 600 }}>PREVIOUS LIFESTYLE &amp; VISUAL HABITS:</span>
                      <div style={{ color: '#334155', fontStyle: h.previous_preferences_notes ? 'normal' : 'italic', marginTop: 2 }}>
                        {h.previous_preferences_notes || 'No notes on file'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
