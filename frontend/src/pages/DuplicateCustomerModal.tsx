import React from 'react';
import { Customer } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import {
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  History,
  X,
  Building,
  Briefcase,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DuplicateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  foundCustomer: Customer | null;
  stats: {
    exam_count: number;
    latest_exam_date?: string | null;
    sales_count: number;
  };
  newData: {
    full_name: string;
    phone_number: string;
    email?: string;
    address?: string;
    age?: number;
    gender?: string;
    occupation?: string;
    preferences_notes?: string;
  };
  onProceedUnchanged: (customerId: number) => void;
  onUpdateAndProceed: (customerId: number, updatedData: any, nextAction: 'examine' | 'profile') => Promise<void>;
  loading?: boolean;
}

export const DuplicateCustomerModal: React.FC<DuplicateCustomerModalProps> = ({
  isOpen,
  onClose,
  foundCustomer,
  stats,
  newData,
  onProceedUnchanged,
  onUpdateAndProceed,
  loading = false,
}) => {
  if (!isOpen || !foundCustomer) return null;

  // Determine which fields have changed between on-file and newly entered
  const isNameChanged = (foundCustomer.full_name || '').trim().toLowerCase() !== (newData.full_name || '').trim().toLowerCase();
  const isPhoneChanged = (foundCustomer.phone_number || '').trim() !== (newData.phone_number || '').trim();
  const isAgeChanged = Number(foundCustomer.age || 0) !== Number(newData.age || 0) && Boolean(newData.age);
  const isOccupationChanged = (foundCustomer.occupation || '').trim().toLowerCase() !== (newData.occupation || '').trim().toLowerCase() && Boolean(newData.occupation);
  const isAddressChanged = (foundCustomer.address || '').trim().toLowerCase() !== (newData.address || '').trim().toLowerCase() && Boolean(newData.address);
  const isLifestyleChanged = (foundCustomer.preferences_notes || '').trim().toLowerCase() !== (newData.preferences_notes || '').trim().toLowerCase() && Boolean(newData.preferences_notes);

  const hasAnyChanges = isNameChanged || isPhoneChanged || isAgeChanged || isOccupationChanged || isAddressChanged || isLifestyleChanged;

  const registeredDate = foundCustomer.created_at
    ? new Date(foundCustomer.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Recorded previously';

  const lastExamStr = stats.latest_exam_date
    ? new Date(stats.latest_exam_date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'No prior exam';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle, #E2E8F0)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #FEF3C7 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: '#FDE68A',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserCheck size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#92400E' }}>
                Existing Patient Record Found in System
              </h2>
              <div style={{ fontSize: 12.5, color: '#78350F', marginTop: 2 }}>
                Duplicate prevention active: this patient is already registered in the directory.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn s sm"
            onClick={onClose}
            disabled={loading}
            style={{ padding: 6, borderRadius: 8, color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '22px 26px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Patient Overview Card */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <b style={{ fontSize: 16, color: '#0F172A' }}>{foundCustomer.full_name}</b>
                <span className="badge" style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 700, fontSize: 11 }}>
                  {foundCustomer.customer_code}
                </span>
                <span className="badge b-ok" style={{ fontSize: 11 }}>Registered Patient</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                Registered on <b>{registeredDate}</b> &bull; Phone: <b>{foundCustomer.phone_number}</b>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ textAlign: 'right', fontSize: 12 }}>
                <div style={{ color: '#0F172A', fontWeight: 700 }}>{stats.exam_count} Refraction Exam(s)</div>
                <div style={{ color: '#64748B' }}>Latest: {lastExamStr}</div>
              </div>
              <div style={{ borderLeft: '1px solid #CBD5E1', paddingLeft: 12, textAlign: 'right', fontSize: 12 }}>
                <div style={{ color: '#0F172A', fontWeight: 700 }}>{stats.sales_count} Spectacle Order(s)</div>
                <div style={{ color: '#64748B' }}>Dispensing history intact</div>
              </div>
            </div>
          </div>

          {/* Comparison Cards: Stored vs New Details */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <b style={{ fontSize: 14, color: '#1E293B' }}>Demographic &amp; Lifestyle Comparison:</b>
              {hasAnyChanges ? (
                <span className="badge b-warn" style={{ fontSize: 11 }}>
                  Changes Detected (Patient Evolution)
                </span>
              ) : (
                <span className="badge b-ok" style={{ fontSize: 11 }}>
                  All Details Identical
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Previous Stored Record */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Previously Recorded Profile
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Phone:</span> <b>{foundCustomer.phone_number}</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Age:</span> <b>{foundCustomer.age ? `${foundCustomer.age} Yrs` : 'Not recorded'}</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Occupation:</span> <b>{foundCustomer.occupation || '—'}</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Address / Area:</span> <b>{foundCustomer.address || '—'}</b>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Lifestyle / Visual Habits:</span>
                    <div style={{ marginTop: 2, color: '#334155', fontStyle: foundCustomer.preferences_notes ? 'normal' : 'italic' }}>
                      {foundCustomer.preferences_notes || 'No lifestyle habits recorded'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Newly Entered Record */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: hasAnyChanges ? '1.5px solid #F59E0B' : '1px solid #E2E8F0',
                  background: hasAnyChanges ? '#FFFBEB' : '#FFFFFF',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: hasAnyChanges ? '#B45309' : '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  New Details Just Entered {hasAnyChanges && '(Proposed Updates)'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Phone:</span>{' '}
                    <b style={isPhoneChanged ? { color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 } : {}}>
                      {newData.phone_number}
                    </b>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Age:</span>{' '}
                    <b style={isAgeChanged ? { color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 } : {}}>
                      {newData.age ? `${newData.age} Yrs` : '—'}
                    </b>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Occupation:</span>{' '}
                    <b style={isOccupationChanged ? { color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 } : {}}>
                      {newData.occupation || '—'}
                    </b>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Address / Area:</span>{' '}
                    <b style={isAddressChanged ? { color: '#B45309', background: '#FEF3C7', padding: '1px 5px', borderRadius: 4 } : {}}>
                      {newData.address || '—'}
                    </b>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Lifestyle / Visual Habits:</span>
                    <div
                      style={{
                        marginTop: 2,
                        color: isLifestyleChanged ? '#92400E' : '#334155',
                        background: isLifestyleChanged ? '#FEF3C7' : 'transparent',
                        padding: isLifestyleChanged ? '2px 6px' : 0,
                        borderRadius: 4,
                      }}
                    >
                      {newData.preferences_notes || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Instructions Notice */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              fontSize: 12.5,
              color: '#0369A1',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <Sparkles size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <b>Clinical Continuity Protected:</b> Creating a duplicate profile would lose this patient's historical refraction progression and previous spectacles.
              If patient details have evolved, updating will archive their previous demographics in their <b>Profile Evolution</b> history while keeping their single unified record intact.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <button
            type="button"
            className="btn s"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            {/* Action 1: If info is unchanged, direct path to examination */}
            <button
              type="button"
              className="btn s"
              onClick={() => onProceedUnchanged(foundCustomer.id)}
              disabled={loading}
              title="Patient confirms all contact & lifestyle info is still identical"
            >
              <Eye size={15} />
              <span>Details Unchanged &bull; Start Exam</span>
            </button>

            {/* Action 2: Update record with new changes and archive old profile */}
            <button
              type="button"
              className="btn p"
              onClick={() => onUpdateAndProceed(foundCustomer.id, newData, 'examine')}
              disabled={loading}
              title="Save updated demographics, archive old snapshot to history, and open clinical exam"
            >
              <History size={15} />
              <span>{loading ? 'Archiving & Updating...' : 'Update Profile &amp; Start Exam'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
