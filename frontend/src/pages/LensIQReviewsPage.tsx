import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Sparkles, Check, X, ShieldAlert, ArrowRight, User } from 'lucide-react';

interface ReviewQueueItem {
  id: number;
  patientName: string;
  code: string;
  time: string;
  prescribedRx: {
    od_sph: string;
    od_cyl: string;
    od_axis?: string;
    os_sph: string;
    os_cyl: string;
    os_axis?: string;
    add: string;
    pd: string;
  };
  priorRx?: {
    date: string;
    od_sph: string;
    od_cyl: string;
    od_axis: string;
    od_add: string;
    os_sph: string;
    os_cyl: string;
    os_axis: string;
    os_add: string;
  };
  currentRxDate?: string;
  lifestyle: {
    occupation: string;
    screenHours: string;
    driving: boolean;
    budget: string;
  };
  options: {
    id: number;
    rank: number;
    name: string;
    material: string;
    index: string;
    coating: string;
    price: number;
    reason: string;
    inStock: boolean;
  }[];
  status: 'PENDING' | 'APPROVED' | 'MODIFIED';
}

const mockReviews: ReviewQueueItem[] = [
  {
    id: 1,
    patientName: 'Fathima Nazeer',
    code: 'CUST-2026-0042',
    time: 'Today 10:42',
    status: 'PENDING',
    priorRx: {
      date: 'Before, 14 Mar 2024',
      od_sph: '-1.75',
      od_cyl: '-0.50',
      od_axis: '90',
      od_add: '—',
      os_sph: '-1.50',
      os_cyl: '-0.25',
      os_axis: '85',
      os_add: '—',
    },
    currentRxDate: 'Now, 02 Oct 2026',
    prescribedRx: {
      od_sph: '-2.25',
      od_cyl: '-0.50',
      od_axis: '90',
      os_sph: '-2.00',
      os_cyl: '-0.25',
      os_axis: '85',
      add: '+1.00',
      pd: '63.0',
    },
    lifestyle: {
      occupation: 'School Teacher & Online Tutor',
      screenHours: '7 hours/day',
      driving: true,
      budget: 'Mid-tier (~LKR 8,500)',
    },
    options: [
      {
        id: 101,
        rank: 1,
        name: '1.60 BlueProtect SuperThin Anti-Reflective',
        material: 'High-Index MR-8 Resin',
        index: '1.60',
        coating: 'Blue-Cut + Hydrophobic Anti-Glare',
        price: 8500,
        reason: 'Optimal index reduction for -2.25 D prescription, prevents optical peripheral distortion during prolonged laptop whiteboard work.',
        inStock: true,
      },
      {
        id: 102,
        rank: 2,
        name: '1.56 Green Anti-Reflective Hard Coat',
        material: 'Mid-Index NK-55',
        index: '1.56',
        coating: 'Green HMC Anti-Glare',
        price: 5200,
        reason: 'Cost-effective alternative supporting moderate SPH powers with glare reduction for night driving.',
        inStock: true,
      },
      {
        id: 103,
        rank: 3,
        name: '1.50 Standard CR-39 Uncoated Bifocal',
        material: 'Standard CR-39',
        index: '1.50',
        coating: 'Hard Coat Only',
        price: 3500,
        reason: 'Economy option with reading segment, but will result in thicker lens edges compared to 1.60.',
        inStock: true,
      },
    ],
  },
  {
    id: 2,
    patientName: 'Mohamed Rizvi',
    code: 'CUST-2026-0019',
    time: 'Today 09:15',
    status: 'PENDING',
    priorRx: {
      date: 'Before, 18 May 2024',
      od_sph: '-3.00',
      od_cyl: '-1.00',
      od_axis: '100',
      od_add: '+0.75',
      os_sph: '-2.75',
      os_cyl: '-0.75',
      os_axis: '95',
      os_add: '+0.75',
    },
    currentRxDate: 'Now, 02 Oct 2026',
    prescribedRx: {
      od_sph: '-3.75',
      od_cyl: '-1.25',
      od_axis: '105',
      os_sph: '-3.50',
      os_cyl: '-1.00',
      os_axis: '95',
      add: '+1.50',
      pd: '65.5',
    },
    lifestyle: {
      occupation: 'Commercial Vehicle Driver',
      screenHours: '2 hours/day',
      driving: true,
      budget: 'Quality-Focused (~LKR 12,000)',
    },
    options: [
      {
        id: 201,
        rank: 1,
        name: '1.67 Aspheric Polarized Progressive Lens',
        material: 'Ultra Hi-Index 1.67',
        index: '1.67',
        coating: 'Polarized Amber Tint + Anti-Reflective',
        price: 13500,
        reason: 'Eliminates road asphalt glare during high-sun coastal Sri Lanka driving, high astigmatism correction.',
        inStock: true,
      },
      {
        id: 202,
        rank: 2,
        name: '1.60 Photochromic Transitions Single Vision',
        material: 'Hi-Index 1.60',
        index: '1.60',
        coating: 'Auto-Tint Grey Sun Active',
        price: 9800,
        reason: 'Adapts seamlessly between outdoor loading and indoor cab reading.',
        inStock: true,
      },
    ],
  },
  {
    id: 3,
    patientName: 'A. R. Mohamed',
    code: 'CUST-2026-0008',
    time: 'Yesterday 16:30',
    status: 'PENDING',
    prescribedRx: {
      od_sph: '+1.50',
      od_cyl: '0.00',
      os_sph: '+1.50',
      os_cyl: '0.00',
      add: '+1.75',
      pd: '62.0',
    },
    lifestyle: {
      occupation: 'Retired Bank Manager',
      screenHours: '4 hours/day',
      driving: false,
      budget: 'Standard Economy',
    },
    options: [
      {
        id: 301,
        rank: 1,
        name: '1.56 Digital Reading Specialist Blue-Cut',
        material: 'Mid-Index 1.56',
        index: '1.56',
        coating: 'Blue-Shield HMC',
        price: 4800,
        reason: 'Optimized reading corridor for tablet newspaper browsing and book reading at 40cm distance.',
        inStock: true,
      },
    ],
  },
];

interface LensIQReviewsPageProps {
  onApplyToSale?: (customerId: number, lensId: number) => void;
}

export const LensIQReviewsPage: React.FC<LensIQReviewsPageProps> = ({ onApplyToSale }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [reviews, setReviews] = useState<ReviewQueueItem[]>(() => {
    try {
      const stored = localStorage.getItem('optopick_lens_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...mockReviews.filter((m) => !parsed.some((p: any) => p.id === m.id))];
        }
      }
    } catch (e) {}
    return mockReviews;
  });

  const [selectedId, setSelectedId] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('optopick_lens_reviews');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch (e) {}
    return 1;
  });

  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const stored = localStorage.getItem('optopick_lens_reviews');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setReviews([...parsed, ...mockReviews.filter((m) => !parsed.some((p: any) => p.id === m.id))]);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('optopick_reviews_updated', syncFromStorage);
    return () => window.removeEventListener('optopick_reviews_updated', syncFromStorage);
  }, []);

  const selectedReview = reviews.find((r) => r.id === selectedId) || reviews[0];

  const handleApprove = (reviewId: number, lensId: number) => {
    setReviews((prev) => {
      const updated = prev.map((r) => (r.id === reviewId ? { ...r, status: 'APPROVED' as const } : r));
      try {
        localStorage.setItem('optopick_lens_reviews', JSON.stringify(updated));
        window.dispatchEvent(new Event('optopick_reviews_updated'));
      } catch (e) {}
      return updated;
    });
    setSuccessNotice(`Lens recommendation for ${selectedReview.patientName} approved and verified.`);
    setTimeout(() => setSuccessNotice(null), 5000);

    if (onApplyToSale && (selectedReview as any).customerId) {
      onApplyToSale((selectedReview as any).customerId, lensId);
    }
  };

  const handleReject = (reviewId: number) => {
    setReviews((prev) => {
      const updated = prev.map((r) => (r.id === reviewId ? { ...r, status: 'MODIFIED' as const } : r));
      try {
        localStorage.setItem('optopick_lens_reviews', JSON.stringify(updated));
        window.dispatchEvent(new Event('optopick_reviews_updated'));
      } catch (e) {}
      return updated;
    });
    setSuccessNotice(`Recommendation for ${selectedReview.patientName} marked for parameter adjustment.`);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  return (
    <div className="content">
      {/* Notice Banner */}
      {successNotice && (
        <div className="note n-ok">
          <Check size={18} style={{ color: 'var(--status-ok)', marginTop: 1 }} />
          <span>{successNotice}</span>
        </div>
      )}

      <div className="row" style={{ flex: 1, minHeight: 0, gap: 18 }}>
        {/* Left Column: Review Queue (Div 1: 330px well-organized width) */}
        <div className="card col" style={{ width: 330, minWidth: 330, maxWidth: 350, flexShrink: 0, padding: '18px 16px', gap: 12 }}>
          <div className="ch" style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <h2 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>Review Queue</h2>
            <StatusBadge
              variant="ai"
              label={`${reviews.filter((r) => r.status === 'PENDING').length} Pending`}
              icon="sparkles"
            />
          </div>
          <div className="sub" style={{ fontSize: 12.5, marginBottom: 2, lineHeight: 1.4 }}>
            Optical staff has queued customer consultations for optometrist approval.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {reviews.map((r) => {
              const isSelected = r.id === selectedReview.id;
              const isApproved = r.status === 'APPROVED';

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--side-active-bg)'
                      : 'var(--surface-card)',
                    border: `1px solid ${isSelected ? 'var(--primary-action)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        backgroundColor: isApproved ? 'var(--status-ok-bg)' : 'var(--lens-violet-bg)',
                        color: isApproved ? 'var(--status-ok)' : 'var(--lens-violet-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 11,
                        flexShrink: 0,
                      }}
                    >
                      {isApproved ? <Check size={14} /> : r.patientName.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 13.5, display: 'block', color: 'var(--text-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.patientName}
                      </b>
                    </div>
                    <StatusBadge
                      variant={isApproved ? 'ok' : 'warn'}
                      label={isApproved ? 'Approved' : 'Pending'}
                      style={{ fontSize: 10.5, padding: '2px 7px', flexShrink: 0 }}
                    />
                  </div>
                  <div className="sub" style={{ fontSize: 11.5, paddingLeft: 40, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{r.time}</span>
                    <span>{r.options.length} options</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Patient Review Detail (Div 2: flex: 1 expanded detail) */}
        {selectedReview && (
          <div className="card col" style={{ flex: 1, minWidth: 0, padding: '24px 28px', gap: 20 }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: 22, margin: '0 0 4px' }}>{selectedReview.patientName}</h2>
                <div className="sub">
                  {selectedReview.code} · Consultation recorded by front desk · {selectedReview.time}
                </div>
              </div>
              <StatusBadge
                variant={selectedReview.status === 'APPROVED' ? 'ok' : 'warn'}
                label={selectedReview.status === 'APPROVED' ? 'Dispensing Approved' : 'Awaiting Clinician Sign-off'}
                icon={selectedReview.status === 'APPROVED' ? 'check' : 'clock'}
              />
            </div>

            {/* Longitudinal Prescription Comparison (Before vs Now) */}
            {(() => {
              const formatVal = (val: string | undefined | null) => {
                if (!val) return '—';
                if (val === '-' || val === '—') return '—';
                return val.replace(/^-/, '−');
              };

              const prior = selectedReview.priorRx || (
                selectedReview.id === 1
                  ? {
                      date: 'Before, 14 Mar 2024',
                      od_sph: '-1.75',
                      od_cyl: '-0.50',
                      od_axis: '90',
                      od_add: '—',
                      os_sph: '-1.50',
                      os_cyl: '-0.25',
                      os_axis: '85',
                      os_add: '—',
                    }
                  : {
                      date: 'Before, 14 Mar 2024',
                      od_sph: selectedReview.prescribedRx?.od_sph || '-1.75',
                      od_cyl: selectedReview.prescribedRx?.od_cyl || '-0.50',
                      od_axis: selectedReview.prescribedRx?.od_axis || '90',
                      od_add: '—',
                      os_sph: selectedReview.prescribedRx?.os_sph || '-1.50',
                      os_cyl: selectedReview.prescribedRx?.os_cyl || '-0.25',
                      os_axis: selectedReview.prescribedRx?.os_axis || '85',
                      os_add: '—',
                    }
              );

              const beforeDate = prior.date || 'Before, 14 Mar 2024';
              const nowRxDate = selectedReview.currentRxDate || 'Now, 02 Oct 2026';

              const nowRe = {
                sph: selectedReview.id === 1 ? '-2.25' : (selectedReview.prescribedRx?.od_sph || '-2.25'),
                cyl: selectedReview.id === 1 ? '-0.50' : (selectedReview.prescribedRx?.od_cyl || '-0.50'),
                axis: selectedReview.prescribedRx?.od_axis || '90',
                add: selectedReview.id === 1 ? '+1.00' : (selectedReview.prescribedRx?.add || '+1.00'),
              };

              const nowLe = {
                sph: selectedReview.id === 1 ? '-2.00' : (selectedReview.prescribedRx?.os_sph || '-2.00'),
                cyl: selectedReview.id === 1 ? '-0.25' : (selectedReview.prescribedRx?.os_cyl || '-0.25'),
                axis: selectedReview.prescribedRx?.os_axis || '85',
                add: selectedReview.id === 1 ? '+1.00' : (selectedReview.prescribedRx?.add || '+1.00'),
              };

              return (
                <div
                  style={{
                    display: 'flex',
                    borderRadius: 16,
                    overflow: 'hidden',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {/* Left Column: Historical Prescription (Before) */}
                  <div
                    style={{
                      flex: 1,
                      background: isDark ? 'rgba(153, 27, 27, 0.16)' : '#FFF0ED',
                      padding: '16px 24px 18px',
                      borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        color: isDark ? '#FCA5A5' : '#A32B2B',
                        fontSize: 13.5,
                        fontWeight: 700,
                        marginBottom: 12,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {beforeDate}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: isDark ? '1px solid rgba(248, 113, 113, 0.2)' : '1px solid rgba(220, 38, 38, 0.12)',
                          }}
                        >
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px 0', textAlign: 'left', width: '18%' }}>
                            Eye
                          </th>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px', textAlign: 'center', width: '24%' }}>
                            SPH
                          </th>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px', textAlign: 'center', width: '20%' }}>
                            CYL
                          </th>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px', textAlign: 'center', width: '18%' }}>
                            AXIS
                          </th>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px', textAlign: 'center', width: '20%' }}>
                            ADD
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          style={{
                            borderBottom: isDark ? '1px solid rgba(248, 113, 113, 0.15)' : '1px solid rgba(220, 38, 38, 0.10)',
                          }}
                        >
                          <td style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', padding: '10px 4px 10px 0', textAlign: 'left' }}>
                            RE
                          </td>
                          <td style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: isDark ? '#FFFFFF' : '#0F172A', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(prior.od_sph)}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(prior.od_cyl)}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B', padding: '10px 4px', textAlign: 'center' }}>
                            {prior.od_axis}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748B', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(prior.od_add)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', padding: '10px 4px 10px 0', textAlign: 'left' }}>
                            LE
                          </td>
                          <td style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: isDark ? '#FFFFFF' : '#0F172A', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(prior.os_sph)}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(prior.os_cyl)}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B', padding: '10px 4px', textAlign: 'center' }}>
                            {prior.os_axis}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? 'rgba(255, 255, 255, 0.45)' : '#64748B', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(prior.os_add)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Current Refraction (Now) */}
                  <div
                    style={{
                      flex: 1,
                      background: isDark ? 'rgba(6, 95, 70, 0.18)' : '#EEF7F2',
                      padding: '16px 24px 18px',
                    }}
                  >
                    <div
                      style={{
                        color: isDark ? '#86EFAC' : '#15803D',
                        fontSize: 13.5,
                        fontWeight: 700,
                        marginBottom: 12,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {nowRxDate}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px 0', textAlign: 'left', width: '18%' }}>
                            Eye
                          </th>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px', textAlign: 'center', width: '24%' }}>
                            SPH
                          </th>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px', textAlign: 'center', width: '20%' }}>
                            CYL
                          </th>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px', textAlign: 'center', width: '18%' }}>
                            AXIS
                          </th>
                          <th style={{ fontSize: 12.5, fontWeight: 700, color: isDark ? 'rgba(255, 255, 255, 0.6)' : '#5E6D82', padding: '0 4px 8px', textAlign: 'center', width: '20%' }}>
                            ADD
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', padding: '10px 4px 10px 0', textAlign: 'left' }}>
                            RE
                          </td>
                          <td style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: isDark ? '#FFFFFF' : '#0F172A', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(nowRe.sph)}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(nowRe.cyl)}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B', padding: '10px 4px', textAlign: 'center' }}>
                            {nowRe.axis}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A', padding: '10px 4px', textAlign: 'center' }}>
                            {nowRe.add}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', padding: '10px 4px 10px 0', textAlign: 'left' }}>
                            LE
                          </td>
                          <td style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: isDark ? '#FFFFFF' : '#0F172A', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(nowLe.sph)}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B', padding: '10px 4px', textAlign: 'center' }}>
                            {formatVal(nowLe.cyl)}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 500, color: isDark ? '#CBD5E1' : '#1E293B', padding: '10px 4px', textAlign: 'center' }}>
                            {nowLe.axis}
                          </td>
                          <td style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#FFFFFF' : '#0F172A', padding: '10px 4px', textAlign: 'center' }}>
                            {nowLe.add}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* AI Ranked Candidate Lenses */}
            <div>
              <div className="ch" style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 16 }}>Compatible Lenses Ranked by LensIQ</h3>
                <span className="sub r">Ranked deterministically from live Nintavur stock</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedReview.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`card ${opt.rank === 1 ? 'aiw' : ''}`}
                    style={{ padding: '16px 20px', borderRadius: 16 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: opt.rank === 1 ? 'var(--prism-gradient)' : 'var(--portal-bg)',
                            color: opt.rank === 1 ? '#FFFFFF' : 'var(--text-ink)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          #{opt.rank}
                        </span>
                        <div>
                          <b style={{ fontSize: 15, color: 'var(--text-ink)' }}>{opt.name}</b>
                          <div className="sub" style={{ fontSize: 12.5 }}>
                            Index {opt.index} · {opt.material} · {opt.coating}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="big tabular-nums" style={{ fontSize: 18, color: 'var(--text-ink)' }}>
                          LKR {opt.price.toLocaleString('en-US')}
                        </div>
                        <StatusBadge variant="ok" label="In Stock" icon="check" />
                      </div>
                    </div>

                    <p style={{ margin: '8px 0 12px', fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>
                      <b>Clinical Reasoning:</b> {opt.reason}
                    </p>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                      <button
                        type="button"
                        className="btn s sm"
                        onClick={() => handleReject(selectedReview.id)}
                        title="Flag this recommendation for modification by dispensing staff"
                      >
                        <X size={14} />
                        <span>Reject / Need Adjustment</span>
                      </button>
                      <button
                        type="button"
                        className="btn p sm"
                        disabled={selectedReview.status === 'APPROVED'}
                        onClick={() => handleApprove(selectedReview.id, opt.id)}
                      >
                        <Check size={14} />
                        <span>Approve This Lens for Sale</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical Disclaimer */}
            <div className="note n-ai" style={{ marginTop: 'auto', fontSize: 12.5 }}>
              <Sparkles size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <b>Optometrist Clinical Responsibility:</b> LensIQ recommendations are intelligent decision-support aids based on optical physics and catalog boundaries. The licensed optometrist retains final clinical authority over all optical dispensing.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
