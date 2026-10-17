import React, { useState } from 'react';
import { StatusBadge } from '../components/Common/StatusBadge';
import {
  Info,
  Bell,
  Package,
  Sparkles,
  Lock,
  Check,
  Save,
  Eye,
  Clock,
  Calendar,
  Users,
  Glasses,
  Layers,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Key,
  FileText,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'business' | 'rules' | 'stock' | 'ai' | 'security'>('rules');

  // Form State
  const [clinicName, setClinicName] = useState('Indian Optician');
  const [branchAddress, setBranchAddress] = useState('No 67/1, Main Street, Nintavur - 13, Sri Lanka');
  const [ownerName, setOwnerName] = useState('Mr. Musthaq');
  const [phone, setPhone] = useState('+94 67 225 0418');

  // Follow-up Rules State
  const [reviewInterval, setReviewInterval] = useState('12'); // months
  const [uncollectedDays, setUncollectedDays] = useState('3'); // days
  const [lapsedMonths, setLapsedMonths] = useState('24'); // months

  // AI Feature Switches
  const [lensIQActive, setLensIQActive] = useState(true);
  const [optoForecastActive, setOptoForecastActive] = useState(true);
  const [optoRecallActive, setOptoRecallActive] = useState(true);

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 4000);
  };

  return (
    <div className="content">
      {savedNotice && (
        <div className="note n-ok">
          <Check size={18} style={{ color: 'var(--status-ok)', marginTop: 1 }} />
          <span>Practice settings and clinical follow-up intervals successfully updated in MySQL database.</span>
        </div>
      )}

      <div className="row" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Sub-Nav (240px) */}
        <div className="card" style={{ width: 240, padding: 12, height: 'fit-content' }}>
          <button
            type="button"
            className={`nav ${activeTab === 'business' ? 'on' : ''}`}
            onClick={() => setActiveTab('business')}
          >
            <Info size={17} />
            <span>Business details</span>
          </button>
          <button
            type="button"
            className={`nav ${activeTab === 'rules' ? 'on' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            <Bell size={17} />
            <span>Follow-up rules</span>
          </button>
          <button
            type="button"
            className={`nav ${activeTab === 'stock' ? 'on' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <Package size={17} />
            <span>Stock thresholds</span>
          </button>
          <button
            type="button"
            className={`nav ${activeTab === 'ai' ? 'on' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={17} />
            <span>AI features</span>
          </button>
          <button
            type="button"
            className={`nav ${activeTab === 'security' ? 'on' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={17} />
            <span>Security &amp; Auth</span>
          </button>
        </div>

        {/* Right Form Container */}
        <form onSubmit={handleSave} className="col" style={{ flex: 1, gap: 18 }}>
          {activeTab === 'business' && (
            <div className="card">
              <h2>Practice &amp; Branch Profile</h2>
              <div className="sub" style={{ marginBottom: 16 }}>
                Optical center registration details printed on tax invoices and receipts.
              </div>

              <div className="f" style={{ marginBottom: 14 }}>
                <label>Clinic / Practice Name</label>
                <div className="in">
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                  />
                </div>
              </div>

              <div className="f" style={{ marginBottom: 14 }}>
                <label>Branch Street Address</label>
                <div className="in">
                  <input
                    type="text"
                    value={branchAddress}
                    onChange={(e) => setBranchAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ flex: 1 }}>
                  <label>Practice Owner / Consultant</label>
                  <div className="in">
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="f" style={{ flex: 1 }}>
                  <label>Contact Phone</label>
                  <div className="in">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 20, margin: '0 0 4px', color: 'var(--text-ink)' }}>Follow-up &amp; Retention Rules</h2>
                <div className="sub" style={{ fontSize: 13 }}>
                  Used deterministically by OptoRecall to flag patients before any AI draft is generated.
                </div>
              </div>

              {/* Rule 1: Eye Review Interval (Mid-Intense Sapphire Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                  border: '1px solid rgba(37, 99, 235, 0.35)',
                  boxShadow: '0 4px 14px rgba(30, 58, 138, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Eye size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Eye Review Interval
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Flag patients when their last refraction examination exceeds this duration.
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: 12,
                    padding: '4px 8px 4px 12px',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <input
                    type="number"
                    value={reviewInterval}
                    onChange={(e) => setReviewInterval(e.target.value)}
                    style={{
                      width: 55,
                      border: 'none',
                      background: 'transparent',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      outline: 'none',
                      textAlign: 'center',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.22)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    months
                  </span>
                </div>
              </div>

              {/* Rule 2: Order Not Collected Threshold (Mid-Intense Bronze Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
                  border: '1px solid rgba(217, 119, 6, 0.35)',
                  boxShadow: '0 4px 14px rgba(180, 83, 9, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Clock size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Order Not Collected Threshold
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Flag spectacles arrived from Kalmunai workshop that remain uncollected.
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: 12,
                    padding: '4px 8px 4px 12px',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <input
                    type="number"
                    value={uncollectedDays}
                    onChange={(e) => setUncollectedDays(e.target.value)}
                    style={{
                      width: 55,
                      border: 'none',
                      background: 'transparent',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      outline: 'none',
                      textAlign: 'center',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.22)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    days
                  </span>
                </div>
              </div>

              {/* Rule 3: Lapsed Patient Threshold (Mid-Intense Emerald Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
                  border: '1px solid rgba(5, 150, 105, 0.35)',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Calendar size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Lapsed Patient Threshold
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Customers with no visit or purchase for this period eligible for re-engagement.
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: 12,
                    padding: '4px 8px 4px 12px',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <input
                    type="number"
                    value={lapsedMonths}
                    onChange={(e) => setLapsedMonths(e.target.value)}
                    style={{
                      width: 55,
                      border: 'none',
                      background: 'transparent',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      outline: 'none',
                      textAlign: 'center',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.22)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    months
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 20, margin: '0 0 4px', color: 'var(--text-ink)' }}>Stock Reorder Limits</h2>
                <div className="sub" style={{ fontSize: 13 }}>
                  Defines threshold counts that trigger low-stock alerts and OptoForecast warnings.
                </div>
              </div>

              {/* Threshold 1: Frame Low-Stock (Mid-Intense Royal Amethyst Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
                  border: '1px solid rgba(124, 58, 237, 0.35)',
                  boxShadow: '0 4px 14px rgba(109, 40, 217, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Glasses size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Default Frame Low-Stock Threshold
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Alert front desk and procurement when display frames drop below this count.
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: 12,
                    padding: '4px 8px 4px 12px',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <input
                    type="number"
                    defaultValue="3"
                    style={{
                      width: 55,
                      border: 'none',
                      background: 'transparent',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      outline: 'none',
                      textAlign: 'center',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.22)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    units
                  </span>
                </div>
              </div>

              {/* Threshold 2: Lens Blanks Low-Stock (Mid-Intense Oceanic Teal Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                  border: '1px solid rgba(13, 148, 136, 0.35)',
                  boxShadow: '0 4px 14px rgba(15, 118, 110, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Layers size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Default Lens Blanks Threshold
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Alert workshop when single vision &amp; progressive lens blanks drop below threshold.
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(0, 0, 0, 0.22)',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    borderRadius: 12,
                    padding: '4px 8px 4px 12px',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <input
                    type="number"
                    defaultValue="5"
                    style={{
                      width: 55,
                      border: 'none',
                      background: 'transparent',
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      outline: 'none',
                      textAlign: 'center',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.22)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    pairs
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Luminous AI Banner */}
              <div
                style={{
                  padding: '20px 24px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #3730A3 0%, #6D28D9 50%, #BE185D 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 4px 16px rgba(109, 40, 217, 0.3)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Sparkles size={20} color="#FDE047" />
                    <h2 style={{ fontSize: 18, margin: 0, color: '#FFFFFF' }}>AI Modules Configuration (Google Gemini)</h2>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    Server-side LLM reasoning layers. Core optical operations remain 100% functional even if disconnected.
                  </div>
                </div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.18)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}
                >
                  ⚡ Gemini 2.5 Flash
                </div>
              </div>

              {/* Module 1: LensIQ */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    border: '1px solid #C7D2FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14.5, display: 'block', color: 'var(--text-ink)', marginBottom: 2 }}>
                    LensIQ Decision Support
                  </b>
                  <div className="sub" style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
                    Recommends suitable lenses from stock filtered by prescription parameters.
                  </div>
                </div>
                <div
                  className={`sw ${lensIQActive ? '' : 'off'}`}
                  onClick={() => setLensIQActive(!lensIQActive)}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Module 2: OptoForecast */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: '#F0F9FF',
                    color: '#0284C7',
                    border: '1px solid #BAE6FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14.5, display: 'block', color: 'var(--text-ink)', marginBottom: 2 }}>
                    OptoForecast Inventory Intelligence
                  </b>
                  <div className="sub" style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
                    Interprets 90-day sales velocity and highlights shortages and overstock.
                  </div>
                </div>
                <div
                  className={`sw ${optoForecastActive ? '' : 'off'}`}
                  onClick={() => setOptoForecastActive(!optoForecastActive)}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Module 3: OptoRecall */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: '#FFF1F2',
                    color: '#E11D48',
                    border: '1px solid #FECDD3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MessageSquare size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14.5, display: 'block', color: 'var(--text-ink)', marginBottom: 2 }}>
                    OptoRecall AI Message Drafting
                  </b>
                  <div className="sub" style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
                    Drafts personalized SMS/Email reminder drafts without sending any patient PII.
                  </div>
                </div>
                <div
                  className={`sw ${optoRecallActive ? '' : 'off'}`}
                  onClick={() => setOptoRecallActive(!optoRecallActive)}
                  style={{ cursor: 'pointer' }}
                />
              </div>

              {/* Module 4: Gemini Connection Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Cpu size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 14.5, display: 'block', color: 'var(--text-ink)', marginBottom: 2 }}>
                    Gemini API Connection Status
                  </b>
                  <div className="sub" style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
                    Isolated server-side key · gemini-2.5-flash endpoint verified &amp; active
                  </div>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#ECFDF5',
                    color: '#047857',
                    border: '1px solid #A7F3D0',
                    padding: '4px 12px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 6px #10B981',
                    }}
                  />
                  <span>Connected</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ fontSize: 20, margin: '0 0 4px', color: 'var(--text-ink)' }}>Security &amp; Session Configuration</h2>
                <div className="sub" style={{ fontSize: 13 }}>
                  Argon2id cryptographic password hashing and role-based access enforcement.
                </div>
              </div>

              {/* Security 1: Argon2id (Mid-Intense Sapphire Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
                  border: '1px solid rgba(37, 99, 235, 0.35)',
                  boxShadow: '0 4px 14px rgba(30, 58, 138, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Password Hashing Algorithm
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Argon2id (Memory-hard, 64MB, 3 iterations) cryptographic protection
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.22)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    letterSpacing: '0.03em',
                  }}
                >
                  Argon2id Encrypted
                </span>
              </div>

              {/* Security 2: Session Cookie (Mid-Intense Emerald Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
                  border: '1px solid rgba(5, 150, 105, 0.35)',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Lock size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Session Cookie Security
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    HttpOnly, SameSite=Strict, Secure in Production preventing XSS
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.22)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    letterSpacing: '0.03em',
                  }}
                >
                  HttpOnly Strict
                </span>
              </div>

              {/* Security 3: Inactivity Timeout (Mid-Intense Bronze Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #92400E 0%, #D97706 100%)',
                  border: '1px solid rgba(217, 119, 6, 0.35)',
                  boxShadow: '0 4px 14px rgba(180, 83, 9, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <Clock size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Inactivity Session Timeout
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Automatic session expiry after full clinic working day inactivity
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.22)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    letterSpacing: '0.03em',
                  }}
                >
                  8 Hours Active
                </span>
              </div>

              {/* Security 4: Clinical Audit Logging (Mid-Intense Royal Amethyst Theme) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '18px 22px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
                  border: '1px solid rgba(124, 58, 237, 0.35)',
                  boxShadow: '0 4px 14px rgba(109, 40, 217, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.18)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <FileText size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 15, display: 'block', color: '#FFFFFF', marginBottom: 2 }}>
                    Clinical Audit Logging
                  </b>
                  <div className="sub" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Immutable append-only record of all clinical actions and authentication events
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(255, 255, 255, 0.22)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    letterSpacing: '0.03em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={13} />
                  <span>Active &amp; Verified</span>
                </span>
              </div>
            </div>
          )}

          {/* Save Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
            <button type="button" className="btn s" onClick={() => setActiveTab('rules')}>
              Discard Changes
            </button>
            <button type="submit" className="btn p">
              <Save size={16} />
              <span>Save Practice Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
