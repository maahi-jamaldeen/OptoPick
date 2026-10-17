import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BlobButton } from '../components/Common/BlobButton';
import { OpticalNetCanvas } from '../components/Common/OpticalNetCanvas';
import api from '../services/api';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Shield,
  KeyRound,
  Mail,
  ArrowLeft,
  Sparkles,
  ClipboardList,
  Store,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  // Authentication Form State
  const [username, setUsername] = useState('optometrist');
  const [password, setPassword] = useState('Admin@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'STAFF'>('ADMIN');

  // Forgot Password / OTP Flow State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: 'ADMIN' | 'STAFF') => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setUsername('optometrist');
      setPassword('Admin@12345');
    } else {
      setUsername('staff');
      setPassword('Staff@12345');
    }
    setError(null);
  };

  // Step 1: Request OTP via Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    try {
      const res = await api.post<{ message: string; email: string }>('/auth/forgot-password', {
        email: forgotEmail.trim(),
      });
      setForgotSuccessMsg(res.message || 'A 6-digit verification code has been dispatched.');
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(
        err.message || 'No active account found with this email address. Please contact the administrator.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    try {
      await api.post('/auth/verify-otp', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
      });
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || 'Invalid or expired 6-digit verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    setForgotLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });
      setForgotStep(4);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to update password. Please request a new code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFinishReset = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError(null);
    setForgotSuccessMsg(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-glass)',
        overflow: 'hidden',
      }}
    >
      {/* Left Hero Canvas: Optical Atmosphere & Practice Positioning */}
      <div
        style={{
          width: '52%',
          backgroundColor: '#14213D',
          color: '#FFFFFF',
          padding: '56px 64px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
          <div className="mark" style={{ width: 48, height: 48, margin: 0 }}>
            <i style={{ width: 20, height: 20, background: '#14213D' }}></i>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              OptoPick
            </div>
            <div style={{ fontSize: 11.5, color: '#A9B8CD', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Indian Optician · Nintavur
            </div>
          </div>
        </div>

        {/* Interactive Optical Refraction Net Canvas (Gathering & Expanding with Net + Mouse Responsiveness) */}
        <OpticalNetCanvas />

        {/* Hero Mission Statement */}
        <div style={{ marginTop: 'auto', position: 'relative', zIndex: 2, pointerEvents: 'none' }}>
          <div className="serif" style={{ fontSize: 44, lineHeight: 1.15, maxWidth: 460, color: '#FFFFFF', fontWeight: 600 }}>
            A smarter approach to optimal selection
          </div>
          <p style={{ fontSize: 15.5, color: '#CBD6E0', maxWidth: 440, marginTop: 18, lineHeight: 1.6 }}>
            Customers, prescriptions, sales and inventory for <b>Indian Optician, Nintavur</b>. AI suggestions stay with the optometrist until approved.
          </p>

          <div style={{
            marginTop: 24,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 12.5,
            color: 'rgba(255, 255, 255, 0.85)',
          }}>
            <Shield size={14} color="#1E9AA8" />
            <span>Encrypted Clinical &amp; Optical Retail Suite v2.4</span>
          </div>
        </div>
      </div>

      {/* Right Canvas: Authentication Card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px',
          backgroundColor: 'var(--bg-glass)',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 450,
            width: '100%',
            padding: '38px 34px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            borderRadius: 24,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div>
            <h1 style={{ fontSize: 28, margin: '0 0 6px', color: 'var(--text-ink)' }}>Sign in</h1>
            <div className="sub" style={{ fontSize: 13.5, lineHeight: 1.45 }}>
              Use your registered clinic credentials. Your portal opens automatically for your authorized role.
            </div>
          </div>

          {/* Quick Practice Role Selector Pills */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              background: 'var(--portal-bg)',
              padding: 4,
              borderRadius: 16,
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`btn sm flex-grow-1 ${selectedRole === 'ADMIN' ? 'p active' : 'g'}`}
              style={{ fontSize: 12.5 }}
            >
              Optometrist (Clinical)
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('STAFF')}
              className={`btn sm flex-grow-1 ${selectedRole === 'STAFF' ? 'p active' : 'g'}`}
              style={{ fontSize: 12.5 }}
            >
              Optical Staff
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="note n-warn" style={{ padding: '10px 14px' }}>
              <AlertCircle size={16} className="flex-shrink-0" style={{ color: 'var(--status-bad)', marginTop: 2 }} />
              <span style={{ fontSize: 13, color: 'var(--status-bad)' }}>{error}</span>
            </div>
          )}

          {/* Sign In Form with Shared PC Security Enhancements */}
          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div className="f">
              <label>
                Username or Staff Identifier <span className="req">*</span>
              </label>
              <div className="in">
                <User size={18} color="var(--text-sub)" />
                <input
                  type="text"
                  name="op_session_identifier"
                  autoComplete="off"
                  data-lpignore="true"
                  placeholder="e.g. optometrist or staff"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="f">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>
                  Password <span className="req">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotStep(1);
                    setForgotError(null);
                    setForgotSuccessMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--status-info)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="in">
                <Lock size={18} color="var(--text-sub)" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="op_session_credential"
                  autoComplete="new-password"
                  data-lpignore="true"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: 'var(--status-info)',
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Blob Button for Submit */}
            <div style={{ marginTop: 6 }}>
              <BlobButton
                type="submit"
                block
                size="lg"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign in to OptoPick'}
              </BlobButton>
            </div>
          </form>

        </div>
      </div>

      {/* Forgot Password OTP Verification & Reset Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={handleFinishReset}>
          <div
            className="modal-card"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="ch"
              style={{
                padding: '24px 28px 16px',
                borderBottom: '1px solid var(--border-color)',
                margin: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--lens-violet-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={18} color="var(--lens-violet-text)" />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, margin: 0 }}>Practice Password Reset</h2>
                  <div className="sub" style={{ fontSize: 12 }}>
                    Step {forgotStep} of 4 · Email OTP Verification
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn g sm r"
                onClick={handleFinishReset}
              >
                Cancel
              </button>
            </div>

            <div style={{ padding: '24px 28px' }}>
              {/* Error Callout */}
              {forgotError && (
                <div className="note n-warn" style={{ marginBottom: 18 }}>
                  <AlertCircle size={16} className="flex-shrink-0" style={{ color: 'var(--status-bad)', marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: 'var(--status-bad)' }}>{forgotError}</span>
                </div>
              )}

              {/* STEP 1: Enter Email */}
              {forgotStep === 1 && (
                <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13.5, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
                    Enter your registered clinic email address. A 6-digit verification code will be dispatched to your inbox if your account exists in our system.
                  </p>

                  <div className="f">
                    <label>
                      Practice Email Address <span className="req">*</span>
                    </label>
                    <div className="in">
                      <Mail size={18} color="var(--text-sub)" />
                      <input
                        type="email"
                        placeholder="e.g. musthaq@indianoptician.lk"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="hint">
                      For testing: <code>musthaq@indianoptician.lk</code> or <code>staff@indianoptician.lk</code>
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <BlobButton
                      type="submit"
                      block
                      size="md"
                      disabled={forgotLoading || !forgotEmail}
                    >
                      {forgotLoading ? 'Verifying Account...' : 'Send Verification Code'}
                    </BlobButton>
                  </div>
                </form>
              )}

              {/* STEP 2: Enter 6-digit OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="note n-info" style={{ margin: 0, padding: '12px 14px' }}>
                    <Check size={16} color="var(--status-info)" className="flex-shrink-0" style={{ marginTop: 2 }} />
                    <span style={{ fontSize: 13 }}>
                      {forgotSuccessMsg || 'A verification code was dispatched to ' + forgotEmail}
                    </span>
                  </div>

                  <p style={{ fontSize: 13.5, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
                    Please inspect your inbox and enter the 6-digit code below. This code expires in 15 minutes.
                  </p>

                  <div className="f">
                    <label>
                      6-Digit Numeric OTP <span className="req">*</span>
                    </label>
                    <div className="in" style={{ justifyContent: 'center' }}>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        style={{
                          textAlign: 'center',
                          fontSize: 22,
                          letterSpacing: 10,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      className="btn s"
                      onClick={() => setForgotStep(1)}
                      style={{ flex: 1 }}
                    >
                      <ArrowLeft size={15} />
                      <span>Back</span>
                    </button>
                    <div style={{ flex: 2 }}>
                      <BlobButton
                        type="submit"
                        block
                        size="md"
                        disabled={forgotLoading || forgotOtp.length !== 6}
                      >
                        {forgotLoading ? 'Verifying Code...' : 'Verify & Continue'}
                      </BlobButton>
                    </div>
                  </div>
                </form>
              )}

              {/* STEP 3: Enter New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ fontSize: 13.5, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
                    OTP verified successfully. Please enter your new clinical login password.
                  </p>

                  <div className="f">
                    <label>
                      New Password <span className="req">*</span>
                    </label>
                    <div className="in">
                      <Lock size={18} color="var(--text-sub)" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--status-info)',
                          fontSize: 12.5,
                        }}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="f">
                    <label>
                      Confirm New Password <span className="req">*</span>
                    </label>
                    <div className="in">
                      <Lock size={18} color="var(--text-sub)" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Re-type new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <BlobButton
                      type="submit"
                      block
                      size="md"
                      disabled={forgotLoading || !newPassword || !confirmPassword}
                    >
                      {forgotLoading ? 'Updating Password...' : 'Reset & Save Password'}
                    </BlobButton>
                  </div>
                </form>
              )}

              {/* STEP 4: Success Confirmation */}
              {forgotStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16, padding: '10px 0' }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--status-ok-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--status-ok)',
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>

                  <div>
                    <h3 style={{ fontSize: 20, margin: '0 0 6px', color: 'var(--text-ink)' }}>
                      Password Updated!
                    </h3>
                    <p style={{ fontSize: 13.5, color: 'var(--text-sub)', maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>
                      Your credentials have been securely updated in the database. You can now log into OptoPick.
                    </p>
                  </div>

                  <div style={{ width: '100%', marginTop: 8 }}>
                    <BlobButton
                      type="button"
                      block
                      size="md"
                      onClick={handleFinishReset}
                    >
                      Return to Sign In
                    </BlobButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
