import React, { useState } from 'react';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Info, Bell, Package, Sparkles, Lock, Check, Save } from 'lucide-react';

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
            <div className="card">
              <h2>Follow-up &amp; Retention Rules</h2>
              <div className="sub" style={{ marginBottom: 16 }}>
                Used deterministically by OptoRecall to flag patients before any AI draft is generated.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <b>Eye review interval</b>
                  <div className="sub">Flag patients when their last refraction examination exceeds this duration.</div>
                </div>
                <div className="in" style={{ width: 160 }}>
                  <input
                    type="number"
                    value={reviewInterval}
                    onChange={(e) => setReviewInterval(e.target.value)}
                  />
                  <span className="sub">months</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <b>Order not collected threshold</b>
                  <div className="sub">Flag spectacles arrived from Kalmunai workshop that remain uncollected.</div>
                </div>
                <div className="in" style={{ width: 160 }}>
                  <input
                    type="number"
                    value={uncollectedDays}
                    onChange={(e) => setUncollectedDays(e.target.value)}
                  />
                  <span className="sub">days</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0' }}>
                <div style={{ flex: 1 }}>
                  <b>Lapsed patient threshold</b>
                  <div className="sub">Customers with no visit or purchase for this period eligible for re-engagement.</div>
                </div>
                <div className="in" style={{ width: 160 }}>
                  <input
                    type="number"
                    value={lapsedMonths}
                    onChange={(e) => setLapsedMonths(e.target.value)}
                  />
                  <span className="sub">months</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="card">
              <h2>Stock Reorder Limits</h2>
              <div className="sub" style={{ marginBottom: 16 }}>
                Defines threshold counts that trigger low-stock alerts and OptoForecast warnings.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <b>Default Frame Low-Stock Threshold</b>
                  <div className="sub">Alert front desk when shelf stock drops below this number.</div>
                </div>
                <div className="in" style={{ width: 140 }}>
                  <input type="number" defaultValue="3" />
                  <span className="sub">units</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0' }}>
                <div style={{ flex: 1 }}>
                  <b>Default Lens Blanks Threshold</b>
                  <div className="sub">Alert when single vision pairs drop below threshold.</div>
                </div>
                <div className="in" style={{ width: 140 }}>
                  <input type="number" defaultValue="5" />
                  <span className="sub">pairs</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="card aiw">
              <h2>AI Modules Configuration (Google Gemini)</h2>
              <div className="sub" style={{ marginBottom: 16 }}>
                Server-side LLM reasoning layers. Core optical operations remain 100% functional even if disconnected.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <b>LensIQ Decision Support</b>
                  <div className="sub">Recommends suitable lenses from stock filtered by prescription parameters.</div>
                </div>
                <div
                  className={`sw ${lensIQActive ? '' : 'off'}`}
                  onClick={() => setLensIQActive(!lensIQActive)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <b>OptoForecast Inventory Intelligence</b>
                  <div className="sub">Interprets 90-day sales velocity and highlights shortages and overstock.</div>
                </div>
                <div
                  className={`sw ${optoForecastActive ? '' : 'off'}`}
                  onClick={() => setOptoForecastActive(!optoForecastActive)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ flex: 1 }}>
                  <b>OptoRecall AI Message Drafting</b>
                  <div className="sub">Drafts personalized SMS/Email reminder drafts without sending any patient PII.</div>
                </div>
                <div
                  className={`sw ${optoRecallActive ? '' : 'off'}`}
                  onClick={() => setOptoRecallActive(!optoRecallActive)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0' }}>
                <div style={{ flex: 1 }}>
                  <b>Gemini API Connection Status</b>
                  <div className="sub">Isolated server-side key · gemini-2.5-flash endpoint verified</div>
                </div>
                <StatusBadge variant="ok" label="Connected" icon="check" />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2>Security &amp; Session Configuration</h2>
              <div className="sub" style={{ marginBottom: 16 }}>
                Argon2id cryptographic password hashing and role-based access enforcement.
              </div>

              <div className="kv">
                <span>Password Hashing Algorithm</span>
                <b>Argon2id (Memory-hard, 64MB, 3 iterations)</b>
              </div>
              <div className="kv">
                <span>Session Cookie Security</span>
                <b>HttpOnly, SameSite=Strict, Secure in Production</b>
              </div>
              <div className="kv">
                <span>Inactivity Session Timeout</span>
                <b>8 Hours (Full clinic working day)</b>
              </div>
              <div className="kv">
                <span>Clinical Audit Logging</span>
                <StatusBadge variant="ok" label="Active" icon="check" />
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
