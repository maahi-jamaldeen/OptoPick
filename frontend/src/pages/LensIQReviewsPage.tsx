import React, { useState, useEffect } from 'react';
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
    os_sph: string;
    os_cyl: string;
    add: string;
    pd: string;
  };
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
    prescribedRx: {
      od_sph: '-2.25',
      od_cyl: '-0.50',
      os_sph: '-2.00',
      os_cyl: '-0.50',
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
    prescribedRx: {
      od_sph: '-3.75',
      od_cyl: '-1.25',
      os_sph: '-3.50',
      os_cyl: '-1.00',
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

      <div className="row" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Column: Review Queue (340px) */}
        <div className="card col" style={{ width: 340, padding: '20px 18px', gap: 12 }}>
          <div className="ch" style={{ margin: 0 }}>
            <h2>Review Queue</h2>
            <span className="r">
              <StatusBadge
                variant="ai"
                label={`${reviews.filter((r) => r.status === 'PENDING').length} Pending`}
                icon="sparkles"
              />
            </span>
          </div>
          <div className="sub" style={{ fontSize: 12.5, marginBottom: 4 }}>
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
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--side-active-bg)'
                      : 'var(--surface-card)',
                    border: `1px solid ${isSelected ? 'var(--primary-action)' : 'var(--border-subtle)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: isApproved ? 'var(--status-ok-bg)' : 'var(--lens-violet-bg)',
                      color: isApproved ? 'var(--status-ok)' : 'var(--lens-violet-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 12.5,
                      flexShrink: 0,
                    }}
                  >
                    {isApproved ? <Check size={16} /> : r.patientName.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 13.5, display: 'block', color: 'var(--text-ink)' }}>
                      {r.patientName}
                    </b>
                    <span className="sub" style={{ fontSize: 12 }}>
                      {r.time} · {r.options.length} options
                    </span>
                  </div>
                  <StatusBadge
                    variant={isApproved ? 'ok' : 'warn'}
                    label={isApproved ? 'Approved' : 'Pending'}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Patient Review Detail */}
        {selectedReview && (
          <div className="card col" style={{ flex: 1, padding: '24px 28px', gap: 18 }}>
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

            {/* Prescribed Power & Lifestyle Context Grid */}
            <div className="row" style={{ gap: 14 }}>
              {/* Prescribed Rx Matrix */}
              <div
                style={{
                  flex: 1.2,
                  backgroundColor: 'var(--portal-bg)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: 8 }}>
                  Clinical Refraction Prescribed
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <div>
                    <span className="sub">OD (Right Eye):</span>{' '}
                    <b className="tabular-nums">
                      {selectedReview.prescribedRx.od_sph} / {selectedReview.prescribedRx.od_cyl}
                    </b>
                  </div>
                  <div>
                    <span className="sub">OS (Left Eye):</span>{' '}
                    <b className="tabular-nums">
                      {selectedReview.prescribedRx.os_sph} / {selectedReview.prescribedRx.os_cyl}
                    </b>
                  </div>
                  <div>
                    <span className="sub">ADD:</span> <b className="tabular-nums">{selectedReview.prescribedRx.add}</b>
                  </div>
                  <div>
                    <span className="sub">PD:</span> <b className="tabular-nums">{selectedReview.prescribedRx.pd} mm</b>
                  </div>
                </div>
              </div>

              {/* Lifestyle Context */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: 'var(--portal-bg)',
                  borderRadius: 14,
                  padding: '14px 18px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: 8 }}>
                  Patient Lifestyle &amp; Budget
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <div><b>Occupation:</b> {selectedReview.lifestyle.occupation}</div>
                  <div><b>Screen:</b> {selectedReview.lifestyle.screenHours} · <b>Night Driving:</b> {selectedReview.lifestyle.driving ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

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
