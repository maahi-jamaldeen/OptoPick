import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Plus, Search, Phone, Mail, MapPin, Building, Check, AlertCircle } from 'lucide-react';

interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  credit_terms?: string | null;
  settlement_method?: string | null;
  lead_time?: string | null;
  warranty_terms?: string | null;
  is_active: number | boolean;
}

const mockSuppliers: Supplier[] = [
  {
    id: 1,
    supplier_code: 'SUP-001',
    name: 'Lanka Optical Imports (Pvt) Ltd',
    contact_person: 'Mr. K. Perera',
    phone: '011 234 5678',
    email: 'orders@lankaoptical.lk',
    address: 'No 45, Sea Street, Colombo 11',
    is_active: 1,
  },
  {
    id: 2,
    supplier_code: 'SUP-002',
    name: 'Vision Care Distribution Colombo',
    contact_person: 'Mr. N. Farook',
    phone: '077 123 4567',
    email: 'sales@visioncarelk.com',
    address: 'No 120, Ward Place, Colombo 07',
    is_active: 1,
  },
  {
    id: 3,
    supplier_code: 'SUP-003',
    name: 'Eastern Eye Supplies Kalmunai',
    contact_person: 'Mr. M. S. M. Rameez',
    phone: '067 222 9876',
    email: 'eastern.supplies@gmail.com',
    address: 'Main Street, Kalmunai - 02',
    is_active: 1,
  },
  {
    id: 4,
    supplier_code: 'SUP-004',
    name: 'Apex Ophthalmic Laboratories Kandy',
    contact_person: 'Mrs. D. Jayawardena',
    phone: '081 223 4455',
    email: 'lab@apexophthalmic.lk',
    address: 'Peradeniya Road, Kandy',
    is_active: 1,
  },
];

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // View Terms / Details Modal State
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  // Edit Supplier Modal State
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editIsActive, setEditIsActive] = useState(1);
  const [editCreditTerms, setEditCreditTerms] = useState('');
  const [editLeadTime, setEditLeadTime] = useState('');
  const [editWarrantyTerms, setEditWarrantyTerms] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Deactivate / Delete Confirm State
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  // New Supplier Form State
  const [code, setCode] = useState(`SUP-00${mockSuppliers.length + 1}`);
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const loadSuppliers = async () => {
    try {
      const res: any = await api.get('/products/suppliers?all=true');
      if (res?.suppliers?.length) {
        setSuppliers(res.suppliers);
      } else if (res?.data?.suppliers?.length) {
        setSuppliers(res.data.suppliers);
      }
    } catch (err) {
      console.warn('Using local supplier seed data:', err);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const newSup: Supplier = {
      id: Date.now(),
      supplier_code: code,
      name,
      contact_person: contactPerson || null,
      phone,
      email: email || null,
      address: address || null,
      is_active: 1,
    };

    try {
      setLoading(true);
      await api.post('/products/suppliers', newSup);
      await loadSuppliers();
      setShowAddModal(false);
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
    } catch (err: any) {
      setSuppliers((prev) => [newSup, ...prev]);
      setShowAddModal(false);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setEditCode(s.supplier_code);
    setEditName(s.name);
    setEditContact(s.contact_person || '');
    setEditPhone(s.phone);
    setEditEmail(s.email || '');
    setEditAddress(s.address || '');
    setEditIsActive(Number(s.is_active));
    setEditCreditTerms(s.credit_terms || 'Net 30 Days credit settlement from date of physical Goods Receipt at Nintavur');
    setEditLeadTime(s.lead_time || '2 to 3 Business Days via standard courier delivery to Indian Optician');
    setEditWarrantyTerms(s.warranty_terms || '12 months frame hinge warranty; 6 months hard multi-coating guarantee on lenses');
    setEditError(null);
  };

  const handleUpdateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier) return;
    setEditError(null);

    try {
      setLoading(true);
      await api.put(`/products/suppliers/${editingSupplier.id}`, {
        supplier_code: editCode,
        name: editName,
        contact_person: editContact,
        phone: editPhone,
        email: editEmail,
        address: editAddress,
        credit_terms: editCreditTerms,
        lead_time: editLeadTime,
        warranty_terms: editWarrantyTerms,
        is_active: editIsActive,
      });
      await loadSuppliers();
      setEditingSupplier(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update supplier.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrDeactivate = async () => {
    if (!deletingSupplier) return;
    try {
      setLoading(true);
      const res: any = await api.delete(`/products/suppliers/${deletingSupplier.id}`);
      setDeleteMessage(res?.data?.message || res?.message || 'Supplier updated successfully.');
      await loadSuppliers();
      setTimeout(() => {
        setDeletingSupplier(null);
        setDeleteMessage(null);
      }, 1800);
    } catch (err: any) {
      setDeleteMessage(err.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.supplier_code.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="content">
      {/* Top Header Card */}
      <div className="card" style={{ padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 20, margin: '0 0 4px' }}>Optical Suppliers &amp; Laboratories</h2>
            <div className="sub">
              Authorized vendors supplying frames, prescription lens blanks, and accessories to Indian Optician.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="srch" style={{ width: 260 }}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search vendor by name, code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn p"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ minWidth: 980, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Code</th>
                <th style={{ whiteSpace: 'nowrap' }}>Supplier Name</th>
                <th style={{ whiteSpace: 'nowrap' }}>Contact Person</th>
                <th style={{ whiteSpace: 'nowrap' }}>Telephone</th>
                <th style={{ whiteSpace: 'nowrap' }}>Email</th>
                <th>Address / Location</th>
                <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isActive = Number(s.is_active) === 1;
                return (
                  <tr key={s.id} style={{ opacity: isActive ? 1 : 0.65 }}>
                    <td style={{ whiteSpace: 'nowrap' }}><b>{s.supplier_code}</b></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180 }}>
                        <Building size={16} color="var(--text-sub)" />
                        <b>{s.name}</b>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.contact_person || '—'}</td>
                    <td className="num" style={{ whiteSpace: 'nowrap' }}>{s.phone}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {s.email ? <a href={`mailto:${s.email}`} style={{ color: 'var(--status-info)', textDecoration: 'none' }}>{s.email}</a> : '—'}
                    </td>
                    <td style={{ minWidth: 200, maxWidth: 280, fontSize: 13, color: 'var(--text-sub)' }}>{s.address || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusBadge
                        variant={isActive ? 'ok' : 'bad'}
                        label={isActive ? 'Active' : 'Deactivated'}
                        icon={isActive ? 'check' : 'x'}
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn s sm"
                          onClick={() => setViewingSupplier(s)}
                          title="View terms and details"
                        >
                          View Terms
                        </button>
                        <button
                          type="button"
                          className="btn g sm"
                          onClick={() => openEditModal(s)}
                          title="Edit supplier information"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn g sm"
                          style={{ color: isActive ? 'var(--status-bad)' : 'var(--status-ok)' }}
                          onClick={() => setDeletingSupplier(s)}
                          title={isActive ? 'Deactivate or delete' : 'Reactivate'}
                        >
                          {isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ch" style={{ padding: '24px 28px 16px', borderBottom: '1px solid var(--border-color)', margin: 0 }}>
              <h2>Register New Optical Supplier</h2>
              <button
                type="button"
                className="btn g sm r"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {modalError && (
                <div className="note n-warn">
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ width: 140 }}>
                  <label>Supplier Code <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="f" style={{ flex: 1 }}>
                  <label>Company / Vendor Name <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      placeholder="e.g. Lanka Optical Imports"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ flex: 1 }}>
                  <label>Contact Person</label>
                  <div className="in">
                    <input
                      type="text"
                      placeholder="Account representative"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                    />
                  </div>
                </div>
                <div className="f" style={{ flex: 1 }}>
                  <label>Telephone <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      placeholder="e.g. 011 234 5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="f">
                <label>Email Address</label>
                <div className="in">
                  <input
                    type="email"
                    placeholder="orders@vendor.lk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="f">
                <label>Billing &amp; Delivery Address</label>
                <div className="in">
                  <input
                    type="text"
                    placeholder="Street, City, Sri Lanka"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn s" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn p" disabled={loading}>
                  <Check size={16} />
                  <span>{loading ? 'Saving...' : 'Save Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Primary Pop-up: View Terms & Details Modal (Soft Aesthetic, Smooth Appearance) */}
      {viewingSupplier && (
        <div className="op-modal-backdrop" onClick={() => setViewingSupplier(null)}>
          <div className="op-modal-card op-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal-header">
              <div className="op-modal-title">
                <Building size={20} color="var(--primary-action)" />
                <span>Supplier Agreement &amp; Terms: {viewingSupplier.name}</span>
              </div>
              <button
                type="button"
                className="btn g sm"
                onClick={() => setViewingSupplier(null)}
                style={{ border: 'none', padding: 6 }}
              >
                ✕
              </button>
            </div>

            <div className="op-modal-body">
              {/* Top Overview Strip */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--color-soft-blue-grey, #F8FAFC)', borderRadius: 12, border: '1px solid var(--border-color, #E2E8F0)' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Supplier Code</div>
                  <b style={{ fontSize: 16, color: 'var(--primary-action)' }}>{viewingSupplier.supplier_code}</b>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Account Rep</div>
                  <b style={{ fontSize: 14 }}>{viewingSupplier.contact_person || 'Standard Account Manager'}</b>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Account Status</div>
                  <StatusBadge
                    variant={Number(viewingSupplier.is_active) === 1 ? 'ok' : 'bad'}
                    label={Number(viewingSupplier.is_active) === 1 ? 'Authorized Active' : 'Deactivated'}
                    icon={Number(viewingSupplier.is_active) === 1 ? 'check' : 'x'}
                  />
                </div>
              </div>

              {/* Direct Contact Information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-color, #E2E8F0)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Phone size={14} color="var(--primary-action)" /> Direct Telephone
                  </div>
                  <b style={{ fontSize: 14 }}>{viewingSupplier.phone}</b>
                </div>

                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-color, #E2E8F0)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={14} color="var(--primary-action)" /> Official Email
                  </div>
                  <b style={{ fontSize: 14 }}>
                    {viewingSupplier.email ? (
                      <a href={`mailto:${viewingSupplier.email}`} style={{ color: 'var(--primary-action)', textDecoration: 'none' }}>
                        {viewingSupplier.email}
                      </a>
                    ) : '—'}
                  </b>
                </div>

                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border-color, #E2E8F0)', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="var(--primary-action)" /> Registered Warehouse &amp; Billing Address
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{viewingSupplier.address || 'Sri Lanka'}</div>
                </div>
              </div>

              {/* Commercial Terms & Supply Policies */}
              <div style={{ borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: 14 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: 'var(--color-primary-navy)' }}>
                  Optical Procurement &amp; Payment Terms
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, fontSize: 13 }}>
                  <div style={{ padding: '10px 14px', background: 'rgba(241, 245, 249, 0.6)', borderRadius: 8 }}>
                    <b style={{ display: 'block', color: 'var(--color-primary-navy)', marginBottom: 2 }}>Payment Credit Terms:</b>
                    <span>{viewingSupplier.credit_terms || 'Net 30 Days credit settlement from date of physical Goods Receipt at Nintavur.'}</span>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(241, 245, 249, 0.6)', borderRadius: 8 }}>
                    <b style={{ display: 'block', color: 'var(--color-primary-navy)', marginBottom: 2 }}>Settlement Method:</b>
                    <span>{viewingSupplier.settlement_method || 'Direct Electronic Bank Transfer (Commercial Bank / HNB Sri Lanka).'}</span>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(241, 245, 249, 0.6)', borderRadius: 8 }}>
                    <b style={{ display: 'block', color: 'var(--color-primary-navy)', marginBottom: 2 }}>Delivery Lead Time:</b>
                    <span>{viewingSupplier.lead_time || '2 to 3 Business Days via standard courier delivery to Indian Optician.'}</span>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(241, 245, 249, 0.6)', borderRadius: 8 }}>
                    <b style={{ display: 'block', color: 'var(--color-primary-navy)', marginBottom: 2 }}>Warranty &amp; Breakage:</b>
                    <span>{viewingSupplier.warranty_terms || '12 months frame hinge warranty; 6 months hard multi-coating guarantee on lenses.'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="op-modal-footer">
              <button
                type="button"
                className="btn g"
                onClick={() => {
                  const s = viewingSupplier;
                  setViewingSupplier(null);
                  openEditModal(s);
                }}
              >
                Edit Vendor Info
              </button>
              <button
                type="button"
                className="btn p"
                onClick={() => setViewingSupplier(null)}
              >
                Close Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Supplier Modal */}
      {editingSupplier && (
        <div className="op-modal-backdrop" onClick={() => setEditingSupplier(null)}>
          <div className="op-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal-header">
              <div className="op-modal-title">
                <Building size={20} color="var(--primary-action)" />
                <span>Edit Supplier: {editingSupplier.name}</span>
              </div>
              <button
                type="button"
                className="btn g sm"
                onClick={() => setEditingSupplier(null)}
                style={{ border: 'none', padding: 6 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSupplier} className="op-modal-body">
              {editError && (
                <div className="note n-warn">
                  <AlertCircle size={16} />
                  <span>{editError}</span>
                </div>
              )}

              <div className="row" style={{ gap: 12 }}>
                <div className="f" style={{ width: 140 }}>
                  <label>Supplier Code <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="f" style={{ flex: 1 }}>
                  <label>Company Name <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row" style={{ gap: 12 }}>
                <div className="f" style={{ flex: 1 }}>
                  <label>Contact Person</label>
                  <div className="in">
                    <input
                      type="text"
                      value={editContact}
                      onChange={(e) => setEditContact(e.target.value)}
                    />
                  </div>
                </div>
                <div className="f" style={{ flex: 1 }}>
                  <label>Telephone <span className="req">*</span></label>
                  <div className="in">
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row" style={{ gap: 12 }}>
                <div className="f" style={{ flex: 1.5 }}>
                  <label>Email Address</label>
                  <div className="in">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="f" style={{ flex: 1 }}>
                  <label>Status</label>
                  <select
                    className="in sel"
                    value={editIsActive}
                    onChange={(e) => setEditIsActive(Number(e.target.value))}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="f">
                <label>Address / Location</label>
                <div className="in">
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ flex: 1 }}>
                  <label>Credit Terms (e.g. Net 30, Net 14, COD)</label>
                  <div className="in">
                    <input
                      type="text"
                      placeholder="e.g. Net 30 Days from invoice"
                      value={editCreditTerms}
                      onChange={(e) => setEditCreditTerms(e.target.value)}
                    />
                  </div>
                </div>
                <div className="f" style={{ flex: 1 }}>
                  <label>Delivery Lead Time</label>
                  <div className="in">
                    <input
                      type="text"
                      placeholder="e.g. 2 to 3 Business Days"
                      value={editLeadTime}
                      onChange={(e) => setEditLeadTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="f">
                <label>Warranty &amp; Breakage Policy</label>
                <div className="in">
                  <input
                    type="text"
                    placeholder="e.g. 12 months frame hinge warranty"
                    value={editWarrantyTerms}
                    onChange={(e) => setEditWarrantyTerms(e.target.value)}
                  />
                </div>
              </div>

              <div className="op-modal-footer" style={{ margin: '14px -24px -22px', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
                <button type="button" className="btn s" onClick={() => setEditingSupplier(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn p" disabled={loading}>
                  <Check size={16} />
                  <span>{loading ? 'Saving...' : 'Update Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Deactivate / Delete Supplier Modal */}
      {deletingSupplier && (
        <div className="op-modal-backdrop" onClick={() => setDeletingSupplier(null)}>
          <div className="op-modal-card op-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal-header">
              <div className="op-modal-title" style={{ color: 'var(--status-bad)' }}>
                <AlertCircle size={20} />
                <span>Supplier Status Change</span>
              </div>
              <button
                type="button"
                className="btn g sm"
                onClick={() => setDeletingSupplier(null)}
                style={{ border: 'none', padding: 6 }}
              >
                ✕
              </button>
            </div>

            <div className="op-modal-body">
              {deleteMessage ? (
                <div className="note n-info">
                  <span>{deleteMessage}</span>
                </div>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                    Are you sure you want to change the status of <b>{deletingSupplier.name}</b> (<code>{deletingSupplier.supplier_code}</code>)?
                  </p>
                  <div className="note n-warn" style={{ fontSize: 12.5 }}>
                    <span>
                      <b>Safety Notice:</b> If this vendor has existing stock or frames linked in the database, the system will safely <b>deactivate</b> them rather than delete permanently, ensuring historical inventory records remain intact.
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="op-modal-footer">
              <button type="button" className="btn s" onClick={() => setDeletingSupplier(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn p"
                style={{ backgroundColor: 'var(--status-bad)', borderColor: 'var(--status-bad)' }}
                disabled={loading || !!deleteMessage}
                onClick={handleDeleteOrDeactivate}
              >
                {loading ? 'Processing...' : Number(deletingSupplier.is_active) === 1 ? 'Deactivate / Delete' : 'Deactivate Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
