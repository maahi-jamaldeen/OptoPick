import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Customer } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { DuplicateCustomerModal } from './DuplicateCustomerModal';
import { Search, UserPlus, Eye, ShoppingCart, User, AlertCircle, Check, Trash2, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface CustomersPageProps {
  onSelectCustomer: (customerId: number) => void;
  onNewExam: (customerId: number) => void;
  onNewSale: (customerId: number) => void;
  onLaunchLensIQ?: (customerId: number) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  onSelectCustomer,
  onNewExam,
  onNewSale,
  onLaunchLensIQ,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'EXAMINED_TODAY' | 'HAS_RX'>('ALL');

  // New Customer Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [occupation, setOccupation] = useState('');
  const [preferencesNotes, setPreferencesNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Smart Duplicate Patient Detection State
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateCustomer, setDuplicateCustomer] = useState<Customer | null>(null);
  const [duplicateStats, setDuplicateStats] = useState<{ exam_count: number; latest_exam_date?: string | null; sales_count: number }>({
    exam_count: 0,
    latest_exam_date: null,
    sales_count: 0,
  });
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [updatingDuplicate, setUpdatingDuplicate] = useState(false);

  const fetchCustomers = async (searchQuery = '') => {
    try {
      setLoading(true);
      const res = await api.get<{ customers: Customer[] }>(`/customers?q=${encodeURIComponent(searchQuery)}`);
      setCustomers(res.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(query);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const resetForm = () => {
    setFullName('');
    setPhoneNumber('');
    setEmail('');
    setAddress('');
    setAge('');
    setOccupation('');
    setPreferencesNotes('');
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload: any = {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        age: age ? parseInt(age, 10) : undefined,
        gender,
        occupation: occupation.trim() || undefined,
        preferences_notes: preferencesNotes.trim() || undefined,
      };

      // 1. Check for duplicate patient record
      try {
        const checkRes: any = await api.get(
          `/customers/check-duplicate?phone=${encodeURIComponent(payload.phone_number)}&name=${encodeURIComponent(payload.full_name)}`
        );
        const checkData = checkRes?.data || checkRes;
        if (checkData?.exists && checkData?.customer) {
          setDuplicateCustomer(checkData.customer);
          setDuplicateStats(checkData.stats || { exam_count: 0, latest_exam_date: null, sales_count: 0 });
          setPendingPayload(payload);
          setShowDuplicateModal(true);
          setSubmitting(false);
          return;
        }
      } catch (checkErr) {
        console.warn('Duplicate check notice:', checkErr);
      }

      // 2. If no duplicate found, proceed with registration
      const res = await api.post<Customer>('/customers', payload);
      setShowModal(false);
      resetForm();
      fetchCustomers(query);
      if (res?.id) {
        onSelectCustomer(res.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to register customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedUnchanged = (customerId: number) => {
    setShowDuplicateModal(false);
    setShowModal(false);
    resetForm();
    onNewExam(customerId);
  };

  const handleUpdateAndProceed = async (customerId: number, updatedData: any, nextAction: 'examine' | 'profile') => {
    setUpdatingDuplicate(true);
    try {
      await api.put(`/customers/${customerId}`, {
        ...updatedData,
        change_reason: 'Returning patient demographic update',
      });
      await fetchCustomers(query);
      setShowDuplicateModal(false);
      setShowModal(false);
      resetForm();
      if (nextAction === 'examine') {
        onNewExam(customerId);
      } else {
        onSelectCustomer(customerId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update patient profile.');
    } finally {
      setUpdatingDuplicate(false);
    }
  };

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete(`/customers/${customerToDelete.id}`);
      setCustomerToDelete(null);
      fetchCustomers(query);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete customer record.');
    } finally {
      setDeleting(false);
    }
  };

  const waitingCount = customers.filter((c) => !c.exam_count || c.exam_count === 0).length;
  const examinedTodayCount = customers.filter((c) => Boolean(c.examined_today)).length;
  const hasRxCount = customers.filter((c) => c.exam_count && c.exam_count > 0).length;

  const displayedCustomers = customers.filter((c) => {
    if (statusFilter === 'WAITING') return !c.exam_count || c.exam_count === 0;
    if (statusFilter === 'EXAMINED_TODAY') return Boolean(c.examined_today);
    if (statusFilter === 'HAS_RX') return Boolean(c.exam_count && c.exam_count > 0);
    return true;
  });

  return (
    <div className="content">
      {/* Top Controls Card */}
      <div className="card" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 20, margin: '0 0 4px' }}>Customer Directory</h2>
            <div className="sub">
              Search by name, phone number, or unique code (CUST-YYYY-XXXX). Track clinical queue &amp; examinations.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="srch" style={{ width: 290 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search name, phone, code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn p"
              onClick={() => setShowModal(true)}
            >
              <UserPlus size={16} />
              <span>Register Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Registry Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="ch" style={{ padding: '18px 22px 12px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
          <div>
            <h3 style={{ fontSize: 16 }}>Verified Patient Records</h3>
            <span className="sub">{customers.length} total patients registered in Nintavur</span>
          </div>

          {/* Clinical Queue Filter Pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`chip ${statusFilter === 'ALL' ? 'on' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              All ({customers.length})
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === 'WAITING' ? 'on' : ''}`}
              onClick={() => setStatusFilter('WAITING')}
              style={statusFilter === 'WAITING' ? { background: '#f59e0b', color: '#fff', borderColor: '#f59e0b' } : {}}
            >
              <Clock size={12} className="me-1" />
              Waiting in Chair ({waitingCount})
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === 'EXAMINED_TODAY' ? 'on' : ''}`}
              onClick={() => setStatusFilter('EXAMINED_TODAY')}
              style={statusFilter === 'EXAMINED_TODAY' ? { background: '#10b981', color: '#fff', borderColor: '#10b981' } : {}}
            >
              <CheckCircle2 size={12} className="me-1" />
              Examined Today ({examinedTodayCount})
            </button>
            <button
              type="button"
              className={`chip ${statusFilter === 'HAS_RX' ? 'on' : ''}`}
              onClick={() => setStatusFilter('HAS_RX')}
            >
              Has Past Rx ({hasRxCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
            Retrieving customer profiles...
          </div>
        ) : displayedCustomers.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
            <User size={36} style={{ opacity: 0.4, marginBottom: 8 }} />
            <b style={{ display: 'block', fontSize: 15, color: 'var(--text-ink)' }}>No customers found</b>
            <span style={{ fontSize: 13 }}>
              {statusFilter !== 'ALL'
                ? `No patients match the '${statusFilter.replace('_', ' ')}' filter. Click 'All' to view all registered customers.`
                : 'Try another search term or click Register Customer to create one.'}
            </span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Customer Code</th>
                  <th>Full Name</th>
                  <th>Phone Number</th>
                  <th>Age / Gender</th>
                  <th>Clinical Status</th>
                  <th>Registration Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((c) => {
                  const hasExaminedToday = Boolean(c.examined_today);
                  const hasPastExam = Boolean(c.exam_count && c.exam_count > 0);

                  return (
                    <tr key={c.id}>
                      <td><b>{c.customer_code}</b></td>
                      <td>
                        <b>{c.full_name}</b>
                        {c.email && <div className="sub" style={{ fontSize: 12 }}>{c.email}</div>}
                      </td>
                      <td className="num">{c.phone_number}</td>
                      <td>
                        {c.age ? `${c.age} yrs` : '—'} {c.gender ? `• ${c.gender}` : ''}
                        {c.occupation && <div className="sub" style={{ fontSize: 12 }}>{c.occupation}</div>}
                      </td>
                      <td>
                        {hasExaminedToday ? (
                          <div>
                            <StatusBadge variant="ok" label="Examined Today" icon="check" />
                            <div className="sub" style={{ fontSize: 11.5, marginTop: 3 }}>
                              Rx Ready · {c.exam_count} session(s)
                            </div>
                          </div>
                        ) : hasPastExam ? (
                          <div>
                            <StatusBadge variant="info" label="Has Past Rx" />
                            <div className="sub" style={{ fontSize: 11.5, marginTop: 3 }}>
                              {c.latest_exam_date ? new Date(c.latest_exam_date).toLocaleDateString() : 'Recorded'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <StatusBadge variant="warn" label="In Chair / Waiting" icon="clock" />
                            <div className="sub" style={{ fontSize: 11.5, marginTop: 3 }}>
                              Awaiting Refraction
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="sub" style={{ fontSize: 12 }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn s sm"
                            onClick={() => onSelectCustomer(c.id)}
                            title="View Customer Profile & Chronological Rx"
                          >
                            Profile &amp; Rx
                          </button>

                          {/* If patient already has an exam, offer LensIQ as primary next step */}
                          {hasPastExam && onLaunchLensIQ && (
                            <button
                              type="button"
                              className="btn a sm"
                              title="Launch LensIQ Lens Decision Support for this patient"
                              onClick={() => onLaunchLensIQ(c.id)}
                            >
                              <Sparkles size={13} />
                              <span>LensIQ</span>
                            </button>
                          )}

                          {/* Sale Button */}
                          <button
                            type="button"
                            className={hasPastExam ? 'btn p sm' : 'btn s sm'}
                            title="Create Dispensing Sale"
                            onClick={() => onNewSale(c.id)}
                          >
                            <ShoppingCart size={13} />
                            <span>Sale</span>
                          </button>

                          {/* If examined today or past: secondary Re-Exam button. If waiting: prominent Start Exam button */}
                          {hasPastExam ? (
                            <button
                              type="button"
                              className="btn s sm"
                              title="Patient already examined. Click to record an additional/updated refraction session."
                              onClick={() => onNewExam(c.id)}
                              style={{ opacity: 0.85 }}
                            >
                              <Eye size={13} />
                              <span>Re-Exam</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn p sm"
                              title="Patient in chair — click to record eye examination"
                              onClick={() => onNewExam(c.id)}
                              style={{ background: '#0284c7', borderColor: '#0284c7' }}
                            >
                              <Eye size={13} />
                              <span>Start Exam</span>
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="btn s sm"
                            title="Delete Patient Record"
                            onClick={() => {
                              setDeleteError(null);
                              setCustomerToDelete(c);
                            }}
                            style={{
                              color: 'var(--status-danger, #ef4444)',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ch" style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
              <h2>Register New Patient</h2>
              <button
                type="button"
                className="btn g sm r"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div className="note n-warn">
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ flex: 1.3 }}>
                  <label>Full Patient Name <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      placeholder="e.g. Fathima Nazeer"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="f" style={{ flex: 1 }}>
                  <label>Phone Number <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      placeholder="e.g. 077 456 7890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ flex: 1 }}>
                  <label>Email (Optional)</label>
                  <div className="in">
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="f" style={{ width: 110 }}>
                  <label>Age</label>
                  <div className="in">
                    <input
                      type="number"
                      placeholder="Yrs"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                </div>

                <div className="f" style={{ width: 140 }}>
                  <label>Gender</label>
                  <div className="in">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="f">
                <label>Occupation (Crucial for LensIQ Decision Support)</label>
                <div className="in">
                  <input
                    type="text"
                    placeholder="e.g. School Teacher, Driver, Software Developer, Accountant"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />
                </div>
              </div>

              <div className="f">
                <label>Address / Nintavur Area</label>
                <div className="in">
                  <input
                    type="text"
                    placeholder="Street, Grama Niladhari Division, Nintavur"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="f">
                <label>Lifestyle &amp; Visual Habits</label>
                <div className="in ta">
                  <textarea
                    placeholder="e.g. High daily laptop screen exposure, night driving glare sensitivity..."
                    value={preferencesNotes}
                    onChange={(e) => setPreferencesNotes(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn s" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn p" disabled={submitting}>
                  <Check size={16} />
                  <span>{submitting ? 'Registering...' : 'Save & Open Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {customerToDelete && (
        <div className="modal-overlay" onClick={() => !deleting && setCustomerToDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="ch" style={{ padding: '22px 26px 14px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
              <h2 style={{ fontSize: 17, color: 'var(--status-danger, #ef4444)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <AlertCircle size={20} />
                Delete Patient Record
              </h2>
              <button
                type="button"
                className="btn g sm r"
                disabled={deleting}
                onClick={() => setCustomerToDelete(null)}
              >
                Cancel
              </button>
            </div>

            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {deleteError && (
                <div className="note n-warn">
                  <AlertCircle size={16} />
                  <span>{deleteError}</span>
                </div>
              )}

              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--text-ink)' }}>
                Are you sure you want to delete patient <b>{customerToDelete.full_name}</b> (<code>{customerToDelete.customer_code}</code>)?
              </p>

              <div style={{ fontSize: 13, color: 'var(--text-sub)', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border-color)', lineHeight: 1.5 }}>
                This will permanently delete the customer's directory profile along with their clinical refraction records, prescriptions, and history. This action cannot be undone.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn s"
                  disabled={deleting}
                  onClick={() => setCustomerToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn d"
                  disabled={deleting}
                  onClick={handleDeleteCustomer}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    borderColor: '#dc2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Trash2 size={15} />
                  <span>{deleting ? 'Deleting...' : 'Permanently Delete'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Duplicate Patient Detection & Confirmation Modal */}
      <DuplicateCustomerModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setDuplicateCustomer(null);
        }}
        foundCustomer={duplicateCustomer}
        stats={duplicateStats}
        newData={{
          full_name: fullName,
          phone_number: phoneNumber,
          email,
          address,
          age: age ? parseInt(age, 10) : undefined,
          gender,
          occupation,
          preferences_notes: preferencesNotes,
        }}
        onProceedUnchanged={handleProceedUnchanged}
        onUpdateAndProceed={handleUpdateAndProceed}
        loading={updatingDuplicate}
      />
    </div>
  );
};
