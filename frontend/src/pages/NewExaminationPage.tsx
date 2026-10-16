import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Customer } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { ArrowLeft, Check, AlertCircle, Calendar, Plus, Minus, Stethoscope, Sparkles, ShoppingCart, Clock, RotateCcw, Copy } from 'lucide-react';

interface NewExaminationPageProps {
  customerId: number;
  onCancel: () => void;
  onSuccess: (customerId: number) => void;
  onLaunchLensIQ?: (customerId: number) => void;
  onNewSale?: (customerId: number) => void;
}

interface DiopterInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
}

const DiopterInput: React.FC<DiopterInputProps> = ({
  value,
  onChange,
  min = -20,
  max = 20,
  step = 0.25,
  ariaLabel,
}) => {
  const formatValue = (v: number) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2));
  const [text, setText] = useState<string>(() => formatValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(formatValue(value));
    }
  }, [value, isFocused]);

  const handleStep = (delta: number) => {
    const next = Math.round((value + delta) * 100) / 100;
    const clamped = Math.min(max, Math.max(min, next));
    onChange(clamped);
    setText(formatValue(clamped));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(Math.round(parsed * 100) / 100);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(text);
    if (isNaN(parsed) || text.trim() === '' || text === '-' || text === '+') {
      const fallback = 0;
      const clamped = Math.min(max, Math.max(min, fallback));
      onChange(clamped);
      setText(formatValue(clamped));
    } else {
      const clamped = Math.min(max, Math.max(min, Math.round(parsed * 100) / 100));
      onChange(clamped);
      setText(formatValue(clamped));
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        type="button"
        className="btn s sm"
        onClick={() => handleStep(-step)}
        title={`Decrease by ${step} D`}
        aria-label="Decrease diopter"
      >
        <Minus size={14} />
      </button>
      <div className="in" style={{ flex: 1, padding: 0 }}>
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onFocus={(e) => {
            setIsFocused(true);
            e.target.select();
          }}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-label={ariaLabel}
          placeholder="0.00"
          style={{
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'Inter, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
            width: '100%',
          }}
        />
      </div>
      <button
        type="button"
        className="btn s sm"
        onClick={() => handleStep(step)}
        title={`Increase by ${step} D`}
        aria-label="Increase diopter"
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

interface NumberFieldProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  placeholder?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
  required?: boolean;
}

const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  ariaLabel,
  style,
  required,
}) => {
  const [text, setText] = useState<string>(() => (value !== undefined && value !== null ? String(value) : ''));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setText(value !== undefined && value !== null ? String(value) : '');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(text);
    if (isNaN(parsed) || text.trim() === '') {
      const fallback = min !== undefined ? min : 0;
      onChange(fallback);
      setText(String(fallback));
    } else {
      let clamped = parsed;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      onChange(clamped);
      setText(String(clamped));
    }
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      style={style}
      required={required}
      onFocus={(e) => {
        setIsFocused(true);
        e.target.select();
      }}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};

export const NewExaminationPage: React.FC<NewExaminationPageProps> = ({
  customerId,
  onCancel,
  onSuccess,
  onLaunchLensIQ,
  onNewSale,
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [existingTodayExam, setExistingTodayExam] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clinical Form Fields — Default cleared (Plano 0.00) for clean clinical determination
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [odSph, setOdSph] = useState<number>(0.00);
  const [odCyl, setOdCyl] = useState<number>(0.00);
  const [odAxis, setOdAxis] = useState<number>(0);
  const [odAdd, setOdAdd] = useState<number>(0.00);

  const [osSph, setOsSph] = useState<number>(0.00);
  const [osCyl, setOsCyl] = useState<number>(0.00);
  const [osAxis, setOsAxis] = useState<number>(0);
  const [osAdd, setOsAdd] = useState<number>(0.00);

  const [pd, setPd] = useState<number>(63.0);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [previousRx, setPreviousRx] = useState<any>(null);

  const resetFormToPlano = () => {
    setOdSph(0.00);
    setOdCyl(0.00);
    setOdAxis(0);
    setOdAdd(0.00);
    setOsSph(0.00);
    setOsCyl(0.00);
    setOsAxis(0);
    setOsAdd(0.00);
    setPd(63.0);
    setClinicalNotes('');
    setExamDate(new Date().toISOString().split('T')[0]);
  };

  const copyPreviousRx = () => {
    if (!previousRx) return;
    setOdSph(Number(previousRx.od_sph ?? 0));
    setOdCyl(Number(previousRx.od_cyl ?? 0));
    setOdAxis(Number(previousRx.od_axis ?? 0));
    setOdAdd(Number(previousRx.od_add ?? 0));
    setOsSph(Number(previousRx.os_sph ?? 0));
    setOsCyl(Number(previousRx.os_cyl ?? 0));
    setOsAxis(Number(previousRx.os_axis ?? 0));
    setOsAdd(Number(previousRx.os_add ?? 0));
    if (previousRx.pd) setPd(Number(previousRx.pd));
  };

  useEffect(() => {
    async function loadCust() {
      try {
        setLoading(true);
        // Clear all determination input fields by default for the new session
        resetFormToPlano();

        const res = await api.get<{ customer: Customer; examinations: any[] }>(`/customers/${customerId}`);
        setCustomer(res.customer);

        const exams = res.examinations || [];
        // Check if an examination session already exists today
        const todayStr = new Date().toISOString().split('T')[0];
        const found = exams.find((e: any) => {
          const d = e.exam_date ? new Date(e.exam_date).toISOString().split('T')[0] : '';
          const c = e.created_at ? new Date(e.created_at).toISOString().split('T')[0] : '';
          return d === todayStr || c === todayStr;
        });
        setExistingTodayExam(found || null);

        // Find latest previous prescription if patient has historical exams
        const examWithRx = exams.find((e: any) => e.prescription || e.od_sph !== undefined);
        const pastRx = examWithRx?.prescription || (examWithRx?.od_sph !== undefined ? examWithRx : null);
        setPreviousRx(pastRx || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load customer profile.');
      } finally {
        setLoading(false);
      }
    }
    loadCust();
  }, [customerId]);

  const stepDiopter = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number, min: number, max: number) => {
    setter((prev) => {
      const next = Math.round((prev + delta) * 100) / 100;
      if (next < min) return min;
      if (next > max) return max;
      return next;
    });
  };

  const formatD = (val: number) => {
    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        customer_id: customerId,
        exam_date: examDate,
        od_sph: odSph,
        od_cyl: odCyl,
        od_axis: odAxis,
        od_add: odAdd || 0,
        os_sph: osSph,
        os_cyl: osCyl,
        os_axis: osAxis,
        os_add: osAdd || 0,
        pd,
        clinical_notes: clinicalNotes || undefined,
      };

      await api.post('/examinations', payload);
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to sign and record examination.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="content" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="sub">Loading clinical refraction station...</div>
      </div>
    );
  }

  return (
    <div className="content">
      {/* Header Bar */}
      <div className="card" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              className="iconbtn"
              onClick={onCancel}
              title="Return"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 style={{ fontSize: 22, margin: '0 0 2px' }}>Clinical Refraction Determination</h1>
              <div className="sub">
                Patient: <b>{customer?.full_name}</b> ({customer?.customer_code}) · Indian Optician, Nintavur
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {previousRx && (
              <button
                type="button"
                className="btn s sm"
                onClick={copyPreviousRx}
                title="Copy previous prescription values for this patient"
                style={{ fontSize: 12.5 }}
              >
                <Copy size={14} />
                <span>Copy Previous Rx</span>
              </button>
            )}
            <button
              type="button"
              className="btn s sm"
              onClick={resetFormToPlano}
              title="Reset all refraction values to 0.00 (Plano)"
              style={{ fontSize: 12.5 }}
            >
              <RotateCcw size={14} />
              <span>Clear to Plano (0.00)</span>
            </button>
            <StatusBadge variant="ok" label="Authorized Optometrist Mode" icon="shield" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
        {error && (
          <div className="note n-warn">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Notice if patient already has an exam today */}
        {existingTodayExam && (
          <div
            className="note n-warn"
            style={{
              padding: '16px 20px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              border: '1px solid #f59e0b',
              background: 'rgba(245, 158, 11, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={22} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <b style={{ fontSize: 14, color: '#92400e' }}>
                  Patient Already Examined Today
                </b>
                <div style={{ fontSize: 13, color: '#78350f', marginTop: 2 }}>
                  An examination was already recorded today for <b>{customer?.full_name}</b> (Rx: SPH OD {existingTodayExam.od_sph || existingTodayExam.prescription?.od_sph || '—'} / OS {existingTodayExam.os_sph || existingTodayExam.prescription?.os_sph || '—'}).
                  Proceeding below will log an additional session.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {onLaunchLensIQ && (
                <button
                  type="button"
                  className="btn a sm"
                  onClick={() => onLaunchLensIQ(customerId)}
                >
                  <Sparkles size={14} />
                  <span>Launch LensIQ</span>
                </button>
              )}
              {onNewSale && (
                <button
                  type="button"
                  className="btn p sm"
                  onClick={() => onNewSale(customerId)}
                >
                  <ShoppingCart size={14} />
                  <span>Create Dispensing Sale</span>
                </button>
              )}
              <button
                type="button"
                className="btn s sm"
                onClick={onCancel}
              >
                <span>View Profile &amp; Rx</span>
              </button>
            </div>
          </div>
        )}

        {/* Refraction Matrix OD & OS (Side by side) */}
        <div className="row" style={{ gap: 18 }}>
          {/* Right Eye (OD - Oculus Dexter) */}
          <div className="card" style={{ flex: 1, padding: '22px 24px', borderTop: '4px solid var(--primary-action)' }}>
            <div className="ch" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, color: 'var(--text-ink)' }}>Right Eye (OD — Oculus Dexter)</h2>
                <span className="sub">Type diopter reading directly or use 0.25 step buttons</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* SPH */}
              <div className="f">
                <label>Sphere (SPH) Diopters</label>
                <DiopterInput
                  value={odSph}
                  onChange={setOdSph}
                  min={-20}
                  max={20}
                  step={0.25}
                  ariaLabel="Right Eye Sphere Diopter"
                />
              </div>

              {/* CYL */}
              <div className="f">
                <label>Cylinder (CYL) Astigmatism</label>
                <DiopterInput
                  value={odCyl}
                  onChange={setOdCyl}
                  min={-10}
                  max={10}
                  step={0.25}
                  ariaLabel="Right Eye Cylinder Astigmatism"
                />
              </div>

              {/* AXIS */}
              <div className="f">
                <label>Axis (0° to 180°)</label>
                <div className="in">
                  <NumberField
                    min={0}
                    max={180}
                    step={1}
                    value={odAxis}
                    onChange={setOdAxis}
                    ariaLabel="Right Eye Cylinder Axis"
                    style={{ textAlign: 'center', fontSize: 16, fontWeight: 700 }}
                  />
                  <span className="sub">degrees</span>
                </div>
              </div>

              {/* ADD */}
              <div className="f">
                <label>Addition (ADD) for Near Reading</label>
                <DiopterInput
                  value={odAdd}
                  onChange={setOdAdd}
                  min={0}
                  max={4}
                  step={0.25}
                  ariaLabel="Right Eye Near Reading Addition"
                />
              </div>
            </div>
          </div>

          {/* Left Eye (OS - Oculus Sinister) */}
          <div className="card" style={{ flex: 1, padding: '22px 24px', borderTop: '4px solid var(--status-info)' }}>
            <div className="ch" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, color: 'var(--text-ink)' }}>Left Eye (OS — Oculus Sinister)</h2>
                <span className="sub">Type diopter reading directly or use 0.25 step buttons</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* SPH */}
              <div className="f">
                <label>Sphere (SPH) Diopters</label>
                <DiopterInput
                  value={osSph}
                  onChange={setOsSph}
                  min={-20}
                  max={20}
                  step={0.25}
                  ariaLabel="Left Eye Sphere Diopter"
                />
              </div>

              {/* CYL */}
              <div className="f">
                <label>Cylinder (CYL) Astigmatism</label>
                <DiopterInput
                  value={osCyl}
                  onChange={setOsCyl}
                  min={-10}
                  max={10}
                  step={0.25}
                  ariaLabel="Left Eye Cylinder Astigmatism"
                />
              </div>

              {/* AXIS */}
              <div className="f">
                <label>Axis (0° to 180°)</label>
                <div className="in">
                  <NumberField
                    min={0}
                    max={180}
                    step={1}
                    value={osAxis}
                    onChange={setOsAxis}
                    ariaLabel="Left Eye Cylinder Axis"
                    style={{ textAlign: 'center', fontSize: 16, fontWeight: 700 }}
                  />
                  <span className="sub">degrees</span>
                </div>
              </div>

              {/* ADD */}
              <div className="f">
                <label>Addition (ADD) for Near Reading</label>
                <DiopterInput
                  value={osAdd}
                  onChange={setOsAdd}
                  min={0}
                  max={4}
                  step={0.25}
                  ariaLabel="Left Eye Near Reading Addition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Parameters Card (PD & Notes) */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div className="row" style={{ gap: 16 }}>
            <div className="f" style={{ width: 220 }}>
              <label>Pupillary Distance (PD) <span className="req">*</span></label>
              <div className="in">
                <NumberField
                  min={40}
                  max={80}
                  step={0.5}
                  value={pd}
                  onChange={setPd}
                  ariaLabel="Pupillary Distance"
                  required
                />
                <span className="sub">mm</span>
              </div>
              <span className="hint">Standard inter-pupillary measurement</span>
            </div>

            <div className="f" style={{ width: 180 }}>
              <label>Examination Date</label>
              <div className="in">
                <Calendar size={16} color="var(--text-sub)" />
                <input
                  type="date"
                  value={examDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="f" style={{ flex: 1 }}>
              <label>Clinical Observations &amp; Advice</label>
              <div className="in">
                <input
                  type="text"
                  placeholder="e.g. Mild astigmatism complaint during night driving, recommended anti-reflective coating."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <button type="button" className="btn s" onClick={onCancel}>
              Discard Examination
            </button>
            <button type="submit" className="btn p lg" disabled={submitting}>
              <Check size={18} />
              <span>{submitting ? 'Signing...' : 'Sign & Transfer Prescription to Dispensing'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Next-Step Workflow Modal on Examination Completion */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 480, textAlign: 'center', padding: '32px 28px' }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <Check size={30} />
            </div>

            <h2 style={{ fontSize: 20, margin: '0 0 8px' }}>Examination Signed &amp; Recorded</h2>
            <p className="sub" style={{ margin: '0 0 24px', lineHeight: 1.5, fontSize: 14 }}>
              Clinical refraction for <b>{customer?.full_name}</b> has been signed and saved to their permanent record. What would you like to do next?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {onLaunchLensIQ && (
                <button
                  type="button"
                  className="btn a lg"
                  onClick={() => onLaunchLensIQ(customerId)}
                  style={{ justifyContent: 'center' }}
                >
                  <Sparkles size={18} />
                  <span>Launch LensIQ Lens Decision Support</span>
                </button>
              )}
              {onNewSale && (
                <button
                  type="button"
                  className="btn p lg"
                  onClick={() => onNewSale(customerId)}
                  style={{ justifyContent: 'center' }}
                >
                  <ShoppingCart size={18} />
                  <span>Proceed to Dispensing Sale &amp; Fitting</span>
                </button>
              )}
              <button
                type="button"
                className="btn s"
                onClick={() => onSuccess(customerId)}
                style={{ justifyContent: 'center', marginTop: 4 }}
              >
                <span>View Patient Profile &amp; Rx History</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
