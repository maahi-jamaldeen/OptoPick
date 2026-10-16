import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User, AuditLog } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { BlobButton } from '../components/Common/BlobButton';
import {
  Plus,
  Shield,
  Check,
  Lock,
  AlertCircle,
  User as UserIcon,
  RefreshCw,
  Search,
  Activity,
  FileText,
  Clock,
  Terminal,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');

  // New User Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ users: User[] }>('/users');
      setUsers(res.users || []);
    } catch (err) {
      console.warn('Using seeded users list:', err);
      setUsers([
        {
          id: 1,
          full_name: 'Mr. Musthaq (Eye Consultant)',
          username: 'optometrist',
          email: 'musthaq@indianoptician.lk',
          role: 'ADMIN',
          is_active: true,
          created_at: '2026-01-10',
        },
        {
          id: 2,
          full_name: 'Fathima Nusra (Dispensing Staff)',
          username: 'staff',
          email: 'staff@indianoptician.lk',
          role: 'STAFF',
          is_active: true,
          created_at: '2026-02-15',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.get<{ logs: AuditLog[] }>('/users/audit-logs');
      setAuditLogs(res.logs || []);
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const handleToggleStatus = async (user: User) => {
    try {
      await api.patch(`/users/${user.id}/status`);
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await api.post('/users', {
        username,
        email,
        password,
        full_name: fullName,
        role,
      });
      setShowAddModal(false);
      setUsername('');
      setEmail('');
      setPassword('');
      setFullName('');
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };



  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const term = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      (log.full_name && log.full_name.toLowerCase().includes(term)) ||
      (log.username && log.username.toLowerCase().includes(term)) ||
      (log.entity_type && log.entity_type.toLowerCase().includes(term)) ||
      (log.ip_address && log.ip_address.toLowerCase().includes(term))
    );
  });

  const getActionBadgeVariant = (action: string): 'ok' | 'bad' | 'warn' | 'info' => {
    if (action.includes('SUCCESS') || action.includes('CREATE') || action.includes('APPROVED')) return 'ok';
    if (action.includes('FAILED') || action.includes('DELETE') || action.includes('DEACTIVATE')) return 'bad';
    if (action.includes('OTP') || action.includes('REQUESTED') || action.includes('RESET')) return 'warn';
    return 'info';
  };

  const formatAuditDetails = (details: any) => {
    if (!details) return '—';
    if (typeof details === 'string') {
      try {
        const parsed = JSON.parse(details);
        return Object.entries(parsed)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
      } catch {
        return details;
      }
    }
    if (typeof details === 'object') {
      return Object.entries(details)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    return String(details);
  };

  return (
    <div className="content">
      {/* Top Header & Tab Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div className="tabs" style={{ margin: 0, border: 'none' }}>
          <button
            type="button"
            className={`tab ${activeTab === 'users' ? 'on' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <UserIcon size={16} />
            <span>Practice Accounts</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 10,
                background: 'var(--side-active-bg)',
                color: 'var(--text-ink)',
                fontWeight: 700,
              }}
            >
              {users.length}
            </span>
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'audit' ? 'on' : ''}`}
            onClick={() => {
              setActiveTab('audit');
              fetchAuditLogs();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Shield size={16} color="var(--status-info)" />
            <span>Audit Trail &amp; Activity Log</span>
            <span
              style={{
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 10,
                background: 'var(--status-info-bg)',
                color: 'var(--status-info)',
                fontWeight: 700,
              }}
            >
              {auditLogs.length}
            </span>
          </button>
        </div>

        {activeTab === 'users' ? (
          <BlobButton size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={15} />
            <span>Add User Account</span>
          </BlobButton>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="in" style={{ height: 36, width: 260, fontSize: 13 }}>
              <Search size={14} color="var(--text-sub)" />
              <input
                type="text"
                placeholder="Filter audit logs..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
              />
            </div>
            <BlobButton size="sm" onClick={fetchAuditLogs} disabled={auditLoading}>
              <RefreshCw size={14} className={auditLoading ? 'spin' : ''} />
              <span>Refresh Log</span>
            </BlobButton>
          </div>
        )}
      </div>

      {/* TAB 1: USER ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="ch" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: '0 0 2px' }}>Authorized Team Personnel</h2>
              <div className="sub">Clinic staff credentials and role allocations for Indian Optician, Nintavur</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <b>{u.full_name || u.fullName}</b>
                    </td>
                    <td className="sub"><code>{u.username}</code></td>
                    <td className="sub" style={{ fontSize: 12.5 }}>{u.email}</td>
                    <td>
                      <StatusBadge
                        variant={u.role === 'ADMIN' ? 'info' : 'neutral'}
                        label={
                          u.role === 'ADMIN'
                            ? 'Administrator / Optometrist'
                            : 'Optical Staff'
                        }
                      />
                    </td>
                    <td>
                      <StatusBadge
                        variant={u.is_active ? 'ok' : 'bad'}
                        label={u.is_active ? 'Active' : 'Disabled'}
                        icon={u.is_active ? 'check' : 'x'}
                      />
                    </td>
                    <td>
                      {u.username === 'optometrist' ? (
                        <span className="sub" style={{ fontSize: 12, fontStyle: 'italic' }}>Protected</span>
                      ) : (
                        <button
                          type="button"
                          className="btn g sm"
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL & ACTIVITY LOG */}
      {activeTab === 'audit' && (
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="ch" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} color="var(--status-info)" />
                <span>Practice Security &amp; Activity Audit Log</span>
              </h2>
              <div className="sub">
                Immutable, timestamped record of clinical actions, authentication events, and data changes at Indian Optician
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredAuditLogs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-sub)' }}>
                <Clock size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-ink)' }}>No audit events found</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  {auditSearch ? 'No matching logs for your query.' : 'Audit logs will record here as staff and doctors interact with the system.'}
                </div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 160 }}>Timestamp</th>
                    <th>Actor / Staff</th>
                    <th>Action Event</th>
                    <th>Target Entity</th>
                    <th>Terminal / IP</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="sub" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <b style={{ fontSize: 13.5 }}>{log.full_name || log.username || 'System Daemon'}</b>
                          <span className="sub" style={{ fontSize: 11.5 }}>
                            {log.role ? (
                              <span style={{ textTransform: 'capitalize' }}>{log.role.toLowerCase()}</span>
                            ) : (
                              'Internal Service'
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          variant={getActionBadgeVariant(log.action)}
                          label={log.action}
                        />
                      </td>
                      <td className="sub" style={{ fontSize: 12.5 }}>
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </td>
                      <td className="sub" style={{ fontSize: 12 }}>
                        <code>{log.ip_address || 'Clinic Station (127.0.0.1)'}</code>
                      </td>
                      <td className="sub" style={{ fontSize: 12.5, maxWidth: 300 }}>
                        <span title={JSON.stringify(log.details)} style={{ wordBreak: 'break-word' }}>
                          {formatAuditDetails(log.details)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ch" style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
              <h2>Create Clinic User Account</h2>
              <button
                type="button"
                className="btn g sm r"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div className="note n-warn">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="f">
                <label>Full Staff Name <span className="req">*</span></label>
                <div className="in">
                  <input
                    type="text"
                    placeholder="e.g. Dr. Musthaq or A. M. Rizwan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ flex: 1 }}>
                  <label>Username <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      placeholder="e.g. musthaq.admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="f" style={{ flex: 1 }}>
                  <label>Role <span className="req">*</span></label>
                  <div className="in">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                    >
                      <option value="STAFF">Optical Staff</option>
                      <option value="ADMIN">Administrator / Optometrist</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="f">
                <label>Email Address <span className="req">*</span></label>
                <div className="in">
                  <input
                    type="email"
                    placeholder="staff@indianoptician.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="f">
                <label>Initial Temporary Password <span className="req">*</span></label>
                <div className="in">
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn s" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <BlobButton type="submit" disabled={submitting}>
                  <Check size={16} />
                  <span>{submitting ? 'Creating...' : 'Create Account'}</span>
                </BlobButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
