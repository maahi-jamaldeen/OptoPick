import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Customer, Prescription, LensIQRecommendation } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { OptoPickApertureLoader } from '../components/Common/OptoPickApertureLoader';
import { Sparkles, Check, AlertCircle, ArrowRight, Eye, Shield, ShoppingCart, User } from 'lucide-react';

interface LensIQPageProps {
  initialCustomerId?: number;
  initialPrescriptionId?: number;
  onApplyLensToSale?: (customerId: number, lensId: number) => void;
}

export const LensIQPage: React.FC<LensIQPageProps> = ({
  initialCustomerId,
  initialPrescriptionId,
  onApplyLensToSale,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(initialCustomerId || '');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | ''>(initialPrescriptionId || '');

  // Lifestyle Inputs
  const [occupation, setOccupation] = useState('Accountant & Financial Analyst');
  const [screenTime, setScreenTime] = useState('7');
  const [outdoorHours, setOutdoorHours] = useState('2');
  const [driving, setDriving] = useState<'LOW' | 'MODERATE' | 'HIGH'>('MODERATE');
  const [budget, setBudget] = useState<'ECONOMY' | 'STANDARD' | 'PREMIUM'>('STANDARD');
  const [thickness, setThickness] = useState<'STANDARD' | 'THIN' | 'ULTRA_THIN'>('THIN');
  const [selectedCoatings, setSelectedCoatings] = useState<string[]>(['Blue-Cut Filter', 'Anti-Reflective HMC']);

  // Results State
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    ai_assisted: boolean;
    recommendations: LensIQRecommendation[];
    disclaimer: string;
    candidate_count?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  useEffect(() => {
    if (initialPrescriptionId) {
      setSelectedPrescriptionId(initialPrescriptionId);
    }
  }, [initialPrescriptionId]);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await api.get<{ customers: Customer[] }>('/customers?limit=100');
        setCustomers(res.customers || []);
      } catch (err) {
        console.error('Failed to load customers:', err);
      }
    }
    loadCustomers();
  }, []);

  // When customer changes, load their prescriptions and auto-fill occupation
  useEffect(() => {
    async function loadRx() {
      if (!selectedCustomerId) {
        setPrescriptions([]);
        return;
      }
      try {
        const cust = customers.find((c) => c.id === Number(selectedCustomerId));
        if (cust?.occupation) {
          setOccupation(cust.occupation);
        }

        const res = await api.get<{ customer: Customer; examinations: any[] }>(`/customers/${selectedCustomerId}`);
        const list = (res.examinations || [])
          .map((e) => e.prescription)
          .filter(Boolean);
        setPrescriptions(list);
        if (list.length > 0 && !selectedPrescriptionId) {
          setSelectedPrescriptionId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load customer prescriptions:', err);
      }
    }
    loadRx();
  }, [selectedCustomerId, customers]);

  const handleToggleCoating = (name: string) => {
    setSelectedCoatings((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleRunLensIQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select a registered patient.');
      return;
    }
    setError(null);
    setResults(null);
    setLoading(true);

    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        prescription_id: selectedPrescriptionId ? Number(selectedPrescriptionId) : undefined,
        occupation,
        screen_time_hours: parseFloat(screenTime) || 6,
        outdoor_activity_hours: parseFloat(outdoorHours) || 2,
        driving_frequency: driving,
        budget_preference: budget,
        thickness_preference: thickness,
        coating_preference: selectedCoatings.join(', '),
        lifestyle: {
          occupation,
          screen_time_hours_per_day: parseFloat(screenTime) || 6,
          outdoor_hours_per_day: parseFloat(outdoorHours) || 2,
          driving_frequency: driving,
          budget_tier: budget,
          thickness_preference: thickness,
          coating_preferences: selectedCoatings,
        },
      };

      const res = await api.post<any>('/ai/lens-iq/recommend', payload);
      const data = res?.recommendations ? res : (res?.data || res);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'LensIQ analysis encountered a service error.');
    } finally {
      setLoading(false);
    }
  };

  const [reviewSubmittedNotice, setReviewSubmittedNotice] = useState<string | null>(null);

  const handleSubmitForReview = (rec: any) => {
    try {
      const stored = localStorage.getItem('optopick_lens_reviews');
      let reviewsList = stored ? JSON.parse(stored) : [];

      const currentCust = customers.find((c) => c.id === Number(selectedCustomerId));
      const currentRx = prescriptions.find((p) => p.id === Number(selectedPrescriptionId));

      const newReviewItem = {
        id: Date.now(),
        patientName: currentCust?.full_name || 'Patient Consultation',
        code: currentCust?.customer_code || `CUST-2026-${String(selectedCustomerId).padStart(4, '0')}`,
        customerId: Number(selectedCustomerId) || 1,
        time: 'Just now',
        status: 'PENDING',
        prescribedRx: {
          od_sph: currentRx ? String(currentRx.od_sph) : '-2.25',
          od_cyl: currentRx ? String(currentRx.od_cyl) : '-0.25',
          os_sph: currentRx ? String(currentRx.os_sph) : '-1.25',
          os_cyl: currentRx ? String(currentRx.os_cyl) : '-0.50',
          add: currentRx?.od_add ? String(currentRx.od_add) : '0.00',
          pd: currentRx?.pd ? String(currentRx.pd) : '63.0',
        },
        lifestyle: {
          occupation: occupation || 'General',
          screenHours: `${screenTime} hours/day`,
          driving: driving !== 'LOW',
          budget: `${budget} tier`,
        },
        options: results?.recommendations.map((r, idx) => ({
          id: r.lens_id || (r as any).id,
          rank: r.rank || idx + 1,
          name: r.lens_name || (r as any).name,
          material: r.material,
          index: String(r.refractive_index),
          coating: r.coatings || (r as any).coating,
          price: Number(r.price || (r as any).selling_price),
          reason: r.lifestyle_fit_reason || (r as any).recommendation_reason,
          inStock: true,
        })) || [],
      };

      reviewsList.unshift(newReviewItem);
      localStorage.setItem('optopick_lens_reviews', JSON.stringify(reviewsList));
      window.dispatchEvent(new Event('optopick_reviews_updated'));

      setReviewSubmittedNotice(`Submitted ${rec.lens_name || rec.name} to Optometrist Review Queue!`);
      setTimeout(() => setReviewSubmittedNotice(null), 5000);
    } catch (e) {
      console.error('Failed to save review item:', e);
    }
  };

  const selectedRx = prescriptions.find((p) => p.id === Number(selectedPrescriptionId));

  return (
    <div className="content">
      {/* Header Info */}
      <div className="card aiw" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="kicon" style={{ background: 'var(--prism-gradient)', color: '#FFFFFF' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, margin: '0 0 2px' }}>LensIQ — Intelligent Lens Decision Support</h1>
              <div className="sub">
                Deterministic catalog power matching + Google Gemini clinical lifestyle reasoning.
              </div>
            </div>
          </div>

          <StatusBadge variant="ai" label="Optical Decision Engine v2.4" icon="sparkles" />
        </div>
      </div>

      {reviewSubmittedNotice && (
        <div className="note n-ok" style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Check size={18} style={{ color: 'var(--status-ok)', flexShrink: 0 }} />
          <span>{reviewSubmittedNotice}</span>
        </div>
      )}

      <div className="row" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Column: Input Form (420px) */}
        <form onSubmit={handleRunLensIQ} className="card col" style={{ width: 440, padding: '22px 24px', gap: 16 }}>
          <h2 style={{ fontSize: 18 }}>Patient Refraction &amp; Lifestyle</h2>

          {error && (
            <div className="note n-warn">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Select Customer */}
          <div className="f">
            <label>Select Patient <span className="req">*</span></label>
            <div className="in">
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(Number(e.target.value));
                  setSelectedPrescriptionId('');
                  setResults(null);
                  setError(null);
                }}
                required
              >
                <option value="">— Choose Registered Customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.customer_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prescribed Rx Card */}
          {selectedRx && (
            <div style={{ padding: '12px 14px', background: 'var(--portal-bg)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: 6 }}>
                Active Refraction Parameters
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>OD: <b className="tabular-nums">{selectedRx.od_sph} / {selectedRx.od_cyl}</b></span>
                <span>OS: <b className="tabular-nums">{selectedRx.os_sph} / {selectedRx.os_cyl}</b></span>
                <span>ADD: <b className="tabular-nums">{selectedRx.od_add || '0.00'}</b></span>
                <span>PD: <b className="tabular-nums">{selectedRx.pd} mm</b></span>
              </div>
            </div>
          )}

          {/* Occupation */}
          <div className="f">
            <label>Occupation</label>
            <div className="in">
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Teacher, Software Developer, Driver"
              />
            </div>
          </div>

          {/* Hours Row */}
          <div className="row" style={{ gap: 12 }}>
            <div className="f" style={{ flex: 1 }}>
              <label>Daily Screen Time</label>
              <div className="in">
                <input
                  type="number"
                  min="0"
                  max="18"
                  value={screenTime}
                  onChange={(e) => setScreenTime(e.target.value)}
                />
                <span className="sub">hrs</span>
              </div>
            </div>

            <div className="f" style={{ flex: 1 }}>
              <label>Daily Outdoor Sun</label>
              <div className="in">
                <input
                  type="number"
                  min="0"
                  max="16"
                  value={outdoorHours}
                  onChange={(e) => setOutdoorHours(e.target.value)}
                />
                <span className="sub">hrs</span>
              </div>
            </div>
          </div>

          {/* Driving & Budget Tiers */}
          <div className="row" style={{ gap: 12 }}>
            <div className="f" style={{ flex: 1 }}>
              <label>Night Driving</label>
              <div className="in">
                <select
                  value={driving}
                  onChange={(e) => setDriving(e.target.value as any)}
                >
                  <option value="LOW">Rare / None</option>
                  <option value="MODERATE">Regular</option>
                  <option value="HIGH">Frequent Night</option>
                </select>
              </div>
            </div>

            <div className="f" style={{ flex: 1 }}>
              <label>Budget Tier</label>
              <div className="in">
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as any)}
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="STANDARD">Balanced</option>
                  <option value="PREMIUM">Premium Hi-End</option>
                </select>
              </div>
            </div>
          </div>

          {/* Coating Chips */}
          <div className="f">
            <label>Desired Optical Enhancements</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Blue-Cut Filter', 'Anti-Reflective HMC', 'Photochromic Transitions', 'Polarized Anti-Glare', 'Anti-Scratch Tough'].map((coat) => {
                const isSelected = selectedCoatings.includes(coat);
                return (
                  <button
                    key={coat}
                    type="button"
                    className={`chip ${isSelected ? 'on' : ''}`}
                    onClick={() => handleToggleCoating(coat)}
                  >
                    {coat}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="btn a lg"
            disabled={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Sparkles size={18} />
            <span>{loading ? 'Evaluating Optical Candidates...' : 'Run LensIQ Analysis'}</span>
          </button>
        </form>

        {/* Right Column: Recommendations Stream */}
        <div className="col" style={{ flex: 1, gap: 16, overflowY: 'auto' }}>
          {!results && !loading && (
            <div className="card" style={{ padding: '60px 30px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={44} style={{ color: 'var(--lens-violet)', marginBottom: 12, opacity: 0.8 }} />
              <h2 style={{ fontSize: 20 }}>Select a Patient to Generate Lens Suggestions</h2>
              <p className="sub" style={{ maxWidth: 440, marginTop: 8 }}>
                LensIQ filters Indian Optician's stock against the prescribed diopters first, then reasons over lifestyle variables to rank the best lenses.
              </p>
            </div>
          )}

          {loading && (
            <div
              className="card aiw"
              style={{
                padding: '70px 30px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              {/* OptoPick Signature Aperture Animated Loader */}
              <OptoPickApertureLoader size={76} loading={loading} style={{ margin: '6px 0 8px' }} />

              <div>
                <h2 style={{ fontSize: 20, margin: '0 0 6px', fontWeight: 700 }}>Evaluating Candidate Lenses...</h2>
                <div className="sub" style={{ maxWidth: 420, margin: '0 auto', fontSize: 13.5, lineHeight: 1.5 }}>
                  Matching prescribed diopters against MySQL stock and synthesizing lifestyle parameters with Google Gemini.
                </div>
              </div>
            </div>
          )}

          {results && !loading && (
            <>
              <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b style={{ fontSize: 16 }}>{results.recommendations.length} Recommended Lenses</b>
                  <div className="sub">Ranked specifically for {occupation} ({screenTime}h screen / {outdoorHours}h outdoor)</div>
                </div>
                <StatusBadge
                  variant={results.ai_assisted ? 'ai' : 'ok'}
                  label={
                    (results as any).cached
                      ? '⚡ Instant Match (Cached)'
                      : results.ai_assisted
                      ? '✨ Gemini Ranked'
                      : 'Deterministic Filter'
                  }
                  icon="sparkles"
                />
              </div>

              {results.recommendations.map((rec, i) => {
                const lensTitle = rec.lens_name || rec.name || `${rec.brand} ${rec.material} (${rec.lens_code})`;
                const coatingsText = rec.coatings || rec.coating || 'Standard Hard Coat';
                const priceVal = rec.price ?? rec.selling_price ?? 0;
                const reasonText = rec.lifestyle_fit_reason || rec.recommendation_reason || 'Compatible with visual lifestyle parameters.';

                return (
                  <div
                    key={rec.lens_id || i}
                    className={`card ${i === 0 ? 'aiw' : ''}`}
                    style={{ padding: '22px 24px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: i === 0 ? 'var(--prism-gradient)' : 'var(--portal-bg)',
                            color: i === 0 ? '#FFFFFF' : 'var(--text-ink)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 14,
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          #{rec.rank || i + 1}
                        </span>
                        <div>
                          <h3 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>{lensTitle}</h3>
                          <div className="sub" style={{ fontSize: 13, marginTop: 3 }}>
                            Index {rec.refractive_index} · {rec.material} · {coatingsText}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div className="big tabular-nums" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-ink)' }}>
                          LKR {Number(priceVal).toLocaleString('en-US')}
                        </div>
                        <StatusBadge variant="ok" label="In Stock" icon="check" />
                      </div>
                    </div>

                    {/* Recommendation Reasoning */}
                    <div style={{ padding: '14px 16px', background: 'var(--portal-bg)', borderRadius: 12, margin: '10px 0 14px', fontSize: 13.5, lineHeight: 1.55, border: '1px solid var(--border-color)' }}>
                      <div style={{ marginBottom: 6 }}>
                        <b>Lifestyle Fit:</b> {reasonText}
                      </div>
                      {rec.material_explanation && (
                        <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginTop: 4 }}>
                          <b>Material &amp; Optics:</b> {rec.material_explanation}
                        </div>
                      )}
                      {rec.coating_suitability && (
                        <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginTop: 4 }}>
                          <b>Coating Protection:</b> {rec.coating_suitability}
                        </div>
                      )}
                      {rec.trade_offs && (
                        <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginTop: 4 }}>
                          <b>Clinical Considerations:</b> {rec.trade_offs}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: 8 }}>
                      <span className="sub" style={{ fontSize: 12 }}>
                        {rec.lens_code ? `Catalog Code: ${rec.lens_code}` : `Lens ID: #${rec.lens_id}`}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn s sm"
                          onClick={() => handleSubmitForReview(rec)}
                          title="Submit this recommendation for optometrist clinical approval in LensIQ Reviews"
                        >
                          <Shield size={14} />
                          <span>Save as Pending Review</span>
                        </button>
                        {onApplyLensToSale && (
                          <button
                            type="button"
                            className="btn p sm"
                            onClick={() => onApplyLensToSale(Number(selectedCustomerId), rec.lens_id || rec.id)}
                            title="Transfer patient and this recommended lens directly to dispensing sale"
                          >
                            <ShoppingCart size={14} />
                            <span>Apply Lens to New Sale</span>
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Disclaimer */}
              <div className="note n-ai">
                <Sparkles size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{results.disclaimer}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
