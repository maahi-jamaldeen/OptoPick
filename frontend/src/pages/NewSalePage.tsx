import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Customer, Frame, Lens, Accessory, Prescription } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { ShoppingCart, ArrowLeft, Plus, Check, Sparkles, AlertCircle, User, Glasses, Layers, Package } from 'lucide-react';
import { OrganizedSelect } from '../components/Common/OrganizedSelect';

interface NewSalePageProps {
  initialCustomerId?: number;
  initialLensId?: number;
  onCancel: () => void;
  onSuccess: (saleId: number) => void;
  onLaunchLensIQ: (customerId: number, prescriptionId?: number) => void;
}

export const NewSalePage: React.FC<NewSalePageProps> = ({
  initialCustomerId,
  initialLensId,
  onCancel,
  onSuccess,
  onLaunchLensIQ,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(initialCustomerId || '');
  const [customerPrescription, setCustomerPrescription] = useState<Prescription | null>(null);

  // Catalogs
  const [frames, setFrames] = useState<Frame[]>([]);
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);

  // Selected Order Items
  const [selectedFrameId, setSelectedFrameId] = useState<number | ''>('');
  const [selectedLensId, setSelectedLensId] = useState<number | ''>(initialLensId || '');
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<number | ''>('');

  const [discountAmount, setDiscountAmount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [notes, setNotes] = useState('Mounting and bevel edging for Kalmunai fitting lab');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showZeroAdvanceModal, setShowZeroAdvanceModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const cUrl = initialCustomerId
          ? `/customers?dispensing_eligible=true&include_customer_id=${initialCustomerId}&limit=100`
          : '/customers?dispensing_eligible=true&limit=100';

        const [cRes, fRes, lRes, aRes] = await Promise.all([
          api.get<{ customers: Customer[] }>(cUrl),
          api.get<{ frames: Frame[] }>('/products/frames?inStock=true'),
          api.get<{ lenses: Lens[] }>('/products/lenses?inStock=true'),
          api.get<{ accessories: Accessory[] }>('/products/accessories?inStock=true'),
        ]);

        setCustomers(cRes.customers || []);
        setFrames(fRes.frames || []);
        setLenses(lRes.lenses || []);
        setAccessories(aRes.accessories || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load POS catalog.');
      }
    }
    loadData();
  }, [initialCustomerId]);

  // When customer changes, load their active prescription
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerPrescription(null);
      return;
    }
    async function loadRx() {
      try {
        const rx = await api.get<Prescription>(`/prescriptions/customer/${selectedCustomerId}/latest`);
        setCustomerPrescription(rx);
      } catch {
        setCustomerPrescription(null);
      }
    }
    loadRx();
  }, [selectedCustomerId]);

  // Auto-select initial lens if provided
  useEffect(() => {
    if (initialLensId && lenses.length > 0) {
      setSelectedLensId(initialLensId);
    }
  }, [initialLensId, lenses]);

  // Derived Objects
  const selectedFrame = frames.find((f) => f.id === selectedFrameId);
  const selectedLens = lenses.find((l) => l.id === selectedLensId);
  const selectedAccessory = accessories.find((a) => a.id === selectedAccessoryId);

  // Financial Calculations
  const framePrice = selectedFrame ? parseFloat(selectedFrame.selling_price as any) : 0;
  const lensPrice = selectedLens ? parseFloat(selectedLens.selling_price as any) : 0;
  const accessoryPrice = selectedAccessory ? parseFloat(selectedAccessory.selling_price as any) : 0;

  const subtotal = framePrice + lensPrice + accessoryPrice;
  const discount = Math.max(parseFloat(discountAmount) || 0, 0);

  const discountError =
    discount < 0
      ? 'Discount cannot be negative.'
      : discount > subtotal
      ? `Discount cannot exceed subtotal (LKR ${subtotal.toLocaleString('en-US')}).`
      : null;

  const totalAmount = Math.max(subtotal - (discountError ? 0 : discount), 0);
  const advancePaid = Math.max(parseFloat(paidAmount) || 0, 0);

  const paidError =
    advancePaid < 0
      ? 'Advance deposit cannot be negative.'
      : advancePaid > totalAmount
      ? `Advance deposit cannot exceed total payable (LKR ${totalAmount.toLocaleString('en-US')}).`
      : null;

  const balanceDue = Math.max(totalAmount - advancePaid, 0);

  const executeSaleSubmission = async () => {
    setError(null);
    setSubmitting(true);
    setShowZeroAdvanceModal(false);

    try {
      const items: any[] = [];
      if (selectedFrame) {
        items.push({
          item_type: 'FRAME',
          product_id: selectedFrame.id,
          item_id: selectedFrame.id,
          product_name: `${selectedFrame.brand} - ${selectedFrame.model_name || selectedFrame.frame_code || 'Frame'}`,
          unit_price: framePrice,
          quantity: 1,
          total_price: framePrice,
        });
      }
      if (selectedLens) {
        items.push({
          item_type: 'LENS',
          product_id: selectedLens.id,
          item_id: selectedLens.id,
          product_name: selectedLens.brand || 'Lenses',
          unit_price: lensPrice,
          quantity: 1,
          total_price: lensPrice,
        });
      }
      if (selectedAccessory) {
        items.push({
          item_type: 'ACCESSORY',
          product_id: selectedAccessory.id,
          item_id: selectedAccessory.id,
          product_name: selectedAccessory.name,
          unit_price: accessoryPrice,
          quantity: 1,
          total_price: accessoryPrice,
        });
      }

      const payload = {
        customer_id: Number(selectedCustomerId),
        prescription_id: customerPrescription ? customerPrescription.id : undefined,
        total_amount: totalAmount,
        discount_amount: discount,
        paid_amount: advancePaid,
        balance_amount: balanceDue,
        payment_method: paymentMethod,
        order_type: 'CUSTOM_FITTING_ORDER',
        notes: notes || undefined,
        items,
      };

      const res: any = await api.post('/sales', payload);
      const createdSaleId = res?.id || res?.sale?.id;
      if (!createdSaleId) {
        throw new Error('Could not identify created sale ID.');
      }
      onSuccess(createdSaleId);
    } catch (err: any) {
      setError(err.message || 'Failed to process optical sale.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setError('Please select an examined patient for this order.');
      return;
    }
    if (!selectedFrameId && !selectedLensId && !selectedAccessoryId) {
      setError('Order must include at least one frame, lens pair, or accessory.');
      return;
    }
    if (discountError) {
      setError(discountError);
      return;
    }
    if (paidError) {
      setError(paidError);
      return;
    }

    // If advance deposit is 0 and total is positive, confirm with user
    if (advancePaid === 0 && totalAmount > 0) {
      setShowZeroAdvanceModal(true);
      return;
    }

    await executeSaleSubmission();
  };

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
              <h1 style={{ fontSize: 22, margin: '0 0 2px' }}>Optical Dispensing Sale &amp; Billing</h1>
              <div className="sub">
                Indian Optician, Nintavur &bull; Point-of-Sale with automated inventory deduction
              </div>
            </div>
          </div>

          <StatusBadge variant="ok" label="Dispensing Counter POS" icon="check" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="row" style={{ flex: 1, minHeight: 0 }}>
        {/* Left Column: Product Selection & Configuration (flex: 1) */}
        <div className="card col" style={{ flex: 1, padding: '22px 24px', gap: 18 }}>
          <h2 style={{ fontSize: 18 }}>Order Specification</h2>

          {error && (
            <div className="note n-warn">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Select Customer */}
          <div className="f">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0, fontWeight: 600 }}>
                Select Patient / Customer <span className="req">*</span>
              </label>
              <span className="badge" style={{ fontSize: 11, background: 'var(--portal-bg)', color: 'var(--text-muted)' }}>
                {customers.length} Examined Patients Ready
              </span>
            </div>
            <OrganizedSelect
              value={selectedCustomerId}
              onChange={(val) => setSelectedCustomerId(val ? Number(val) : '')}
              required
              placeholder="— Choose Examined Patient Ready for Dispensing —"
              leadingIcon={<User size={16} />}
              options={customers.map((c) => ({
                value: c.id,
                label: c.full_name,
                code: c.customer_code,
                subtitle: `Tel: ${c.phone_number || 'No phone recorded'} • Clinical Examination Ready`,
                stockLabel: 'Ready for POS',
                stockStatus: 'IN_STOCK' as const,
              }))}
            />
            {customers.length === 0 && (
              <div className="note n-info" style={{ marginTop: 6, fontSize: 12 }}>
                <span>No pending unbilled patients. All examined patients currently have an order, or a new customer needs an eye examination first.</span>
              </div>
            )}
          </div>

          {/* Linked Clinical Prescription Notice */}
          {customerPrescription ? (
            <div style={{ padding: '14px 18px', background: 'var(--portal-bg)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <b style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-sub)' }}>
                  Linked Active Examination
                </b>
                <span className="badge b-ok" style={{ fontSize: 11 }}>Signed by Optometrist</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                <span>OD: <b className="tabular-nums">{customerPrescription.od_sph} / {customerPrescription.od_cyl}</b></span>
                <span>OS: <b className="tabular-nums">{customerPrescription.os_sph} / {customerPrescription.os_cyl}</b></span>
                <span>ADD: <b className="tabular-nums">{customerPrescription.od_add || '0.00'}</b></span>
                <span>PD: <b className="tabular-nums">{customerPrescription.pd} mm</b></span>
              </div>
            </div>
          ) : (
            selectedCustomerId && (
              <div className="note n-warn" style={{ padding: '10px 14px' }}>
                <span>No refraction record found for this patient. This order will proceed as an immediate retail sale.</span>
              </div>
            )
          )}

          {/* Select Frame */}
          <div className="f">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Spectacle Frame Model</label>
              {selectedFrame && (
                <span className="badge b-ok" style={{ fontSize: 11, height: 20 }}>
                  Frame Code: {selectedFrame.frame_code || `#FRM-${selectedFrame.id}`}
                </span>
              )}
            </div>
            <OrganizedSelect
              value={selectedFrameId}
              onChange={(val) => setSelectedFrameId(val ? Number(val) : '')}
              placeholder="— None (Patient's Own Frame) —"
              leadingIcon={<Glasses size={16} />}
              options={frames.map((f) => {
                const isOutOfStock = f.stock_quantity === 0;
                const isLowStock = !isOutOfStock && f.stock_quantity <= (f.low_stock_threshold || 2);
                const stockLabel = isOutOfStock
                  ? 'OUT OF STOCK'
                  : isLowStock
                  ? `Low Stock (${f.stock_quantity})`
                  : `Stock: ${f.stock_quantity}`;
                return {
                  value: f.id,
                  label: `${f.brand} ${f.model_name || f.model_number || ''}`,
                  code: f.frame_code,
                  subtitle: `${f.color ? f.color + ' • ' : ''}${f.material || ''}${f.shape ? ' • ' + f.shape : ''}`,
                  price: f.selling_price,
                  stockStatus: isOutOfStock ? ('OUT_OF_STOCK' as const) : isLowStock ? ('LOW_STOCK' as const) : ('IN_STOCK' as const),
                  stockLabel,
                };
              })}
            />
            {selectedFrame && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <StatusBadge
                  status={selectedFrame.stock_quantity === 0 ? 'CRITICAL' : selectedFrame.stock_quantity <= (selectedFrame.low_stock_threshold || 2) ? 'WARNING' : 'ACTIVE'}
                  label={selectedFrame.stock_quantity === 0 ? 'Out of Stock Warning (0 in store)' : selectedFrame.stock_quantity <= (selectedFrame.low_stock_threshold || 2) ? `Low Stock Warning (${selectedFrame.stock_quantity} left)` : `In Stock (${selectedFrame.stock_quantity} units available)`}
                />
                <span className="sub" style={{ fontSize: 12 }}>
                  {selectedFrame.shape} &bull; {selectedFrame.material} &bull; Size: {selectedFrame.size || 'Standard'}
                </span>
              </div>
            )}
          </div>

          {/* Select Lens */}
          <div className="f">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Ophthalmic Lens Pair</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {selectedLens && (
                  <span className="badge b-info" style={{ fontSize: 11, height: 20 }}>
                    Lens Code: {selectedLens.lens_code || `#LNS-${selectedLens.id}`}
                  </span>
                )}
                {selectedCustomerId && (
                  <button
                    type="button"
                    className="btn g sm"
                    style={{ color: 'var(--lens-violet)', padding: 0 }}
                    onClick={() => onLaunchLensIQ(Number(selectedCustomerId), customerPrescription?.id)}
                  >
                    <Sparkles size={13} className="me-1" />
                    <span>Run LensIQ</span>
                  </button>
                )}
              </div>
            </div>
            <OrganizedSelect
              value={selectedLensId}
              onChange={(val) => setSelectedLensId(val ? Number(val) : '')}
              placeholder="— None / Frame Only —"
              leadingIcon={<Layers size={16} />}
              options={lenses.map((l) => ({
                value: l.id,
                label: l.name || (l.brand + ' (' + (l.design_type || 'Lens') + ')'),
                code: l.lens_code,
                subtitle: `${l.material} • Index ${l.refractive_index}${l.design_type ? ' • ' + l.design_type : ''}`,
                price: l.selling_price,
                stockLabel: `Index ${l.refractive_index}`,
                stockStatus: 'IN_STOCK' as const,
              }))}
            />
            {selectedLens && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <StatusBadge variant="ok" label="Optical Lens Pair Active" icon="check" />
                <span className="sub" style={{ fontSize: 12 }}>
                  Index {selectedLens.refractive_index} &bull; {selectedLens.design_type || 'Single Vision'}
                </span>
              </div>
            )}
          </div>

          {/* Select Accessory */}
          <div className="f">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Optical Accessories (Case, Lens Cleaning Spray, Cord)</label>
              {selectedAccessory && (
                <span className="badge b-ok" style={{ fontSize: 11, height: 20 }}>
                  Item Code: {selectedAccessory.item_code || `#ACC-${selectedAccessory.id}`}
                </span>
              )}
            </div>
            <OrganizedSelect
              value={selectedAccessoryId}
              onChange={(val) => setSelectedAccessoryId(val ? Number(val) : '')}
              placeholder="— None —"
              leadingIcon={<Package size={16} />}
              options={accessories.map((a) => {
                const isOutOfStock = a.stock_quantity === 0;
                const isLowStock = !isOutOfStock && a.stock_quantity <= (a.low_stock_threshold || 5);
                const stockLabel = isOutOfStock
                  ? 'OUT OF STOCK'
                  : isLowStock
                  ? `Low Stock (${a.stock_quantity})`
                  : `Stock: ${a.stock_quantity}`;
                return {
                  value: a.id,
                  label: a.name,
                  code: a.item_code,
                  subtitle: 'Optical dispensing add-on accessory',
                  price: a.selling_price,
                  stockStatus: isOutOfStock ? ('OUT_OF_STOCK' as const) : isLowStock ? ('LOW_STOCK' as const) : ('IN_STOCK' as const),
                  stockLabel,
                };
              })}
            />
            {selectedAccessory && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <StatusBadge
                  status={selectedAccessory.stock_quantity === 0 ? 'CRITICAL' : selectedAccessory.stock_quantity <= (selectedAccessory.low_stock_threshold || 5) ? 'WARNING' : 'ACTIVE'}
                  label={selectedAccessory.stock_quantity === 0 ? 'Out of Stock Warning (0 in store)' : selectedAccessory.stock_quantity <= (selectedAccessory.low_stock_threshold || 5) ? `Low Stock Warning (${selectedAccessory.stock_quantity} left)` : `In Stock (${selectedAccessory.stock_quantity} units available)`}
                />
              </div>
            )}
          </div>

          {/* Laboratory / Fitting Glazing Instructions */}
          <div className="f">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0, fontWeight: 600 }}>Laboratory / Fitting Glazing Instructions</label>
              <span className="sub" style={{ fontSize: 12 }}>Click preset to auto-fill or type bespoke notes</span>
            </div>

            {/* Quick Presets Chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {[
                'Full-Rim V-Bevel',
                'Supra Nylon Grooving (0.5mm)',
                'Rimless Drill & Screw Mount',
                'High-Minus Edge Polishing',
                'Patient Own Frame (POF) Re-glaze',
              ].map((preset) => {
                const isActive = notes.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (!notes) {
                        setNotes(preset);
                      } else if (notes.includes(preset)) {
                        const parts = notes.split(';').map((p) => p.trim()).filter((p) => p && p !== preset);
                        setNotes(parts.join('; '));
                      } else {
                        setNotes(`${notes}; ${preset}`);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      background: '#ffffff',
                      border: isActive ? '1.5px solid #6366f1' : '1.5px solid #cbd5e1',
                      color: isActive ? '#4f46e5' : '#1e293b',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 12px',
                      borderRadius: 9999,
                      display: 'inline-flex',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 1px 3px rgba(99, 102, 241, 0.15)' : 'none',
                    }}
                  >
                    + {preset}
                  </button>
                );
              })}
            </div>

            <div className="in">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Mounting and bevel edging for Kalmunai fitting lab; Full-Rim V-Bevel"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Financial Tally & Receipt (380px) */}
        <div className="card col" style={{ width: 380, padding: '24px 26px', gap: 16 }}>
          <h2 style={{ fontSize: 18 }}>Receipt &amp; Payment</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--border-color)' }}>
            <div className="kv">
              <span>Frame:</span>
              <b className="tabular-nums">LKR {framePrice.toLocaleString('en-US')}</b>
            </div>
            <div className="kv">
              <span>Lens Pair:</span>
              <b className="tabular-nums">LKR {lensPrice.toLocaleString('en-US')}</b>
            </div>
            <div className="kv">
              <span>Accessories:</span>
              <b className="tabular-nums">LKR {accessoryPrice.toLocaleString('en-US')}</b>
            </div>
            <div className="kv" style={{ fontWeight: 600 }}>
              <span>Subtotal:</span>
              <b className="tabular-nums">LKR {subtotal.toLocaleString('en-US')}</b>
            </div>
          </div>

          {/* Discount Input */}
          <div className="f">
            <label>Promotional Discount (LKR)</label>
            <div className="in" style={{ borderColor: discountError ? 'var(--status-bad)' : undefined }}>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discountAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || Number(val) >= 0) {
                    setDiscountAmount(val);
                  }
                }}
              />
              <span className="sub">LKR</span>
            </div>
            {discountError && (
              <span style={{ fontSize: 11.5, color: 'var(--status-bad)', marginTop: 2 }}>
                {discountError}
              </span>
            )}
          </div>

          {/* Net Payable Big Banner */}
          <div style={{ padding: '16px 20px', backgroundColor: 'var(--portal-bg)', borderRadius: 14, border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span className="sub" style={{ fontSize: 12.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Net Payable Total
            </span>
            <div className="big tabular-nums" style={{ fontSize: 34, color: 'var(--text-ink)', marginTop: 4 }}>
              LKR {totalAmount.toLocaleString('en-US')}
            </div>
          </div>

          {/* Advance Deposit */}
          <div className="f">
            <label>Advance Deposit Paid (LKR)</label>
            <div className="in" style={{ borderColor: paidError ? 'var(--status-bad)' : undefined }}>
              <input
                type="number"
                min="0"
                max={totalAmount}
                value={paidAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || Number(val) >= 0) {
                    setPaidAmount(val);
                  }
                }}
              />
              <span className="sub">LKR</span>
            </div>
            {paidError && (
              <span style={{ fontSize: 11.5, color: 'var(--status-bad)', marginTop: 2 }}>
                {paidError}
              </span>
            )}
          </div>

          {/* Balance Due Display */}
          <div className="kv" style={{ padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontWeight: 600 }}>Balance on Collection:</span>
            <b className="tabular-nums" style={{ color: balanceDue > 0 ? 'var(--status-warn)' : 'var(--status-ok)', fontSize: 18 }}>
              LKR {balanceDue.toLocaleString('en-US')}
            </b>
          </div>

          {/* Payment Method: Direct Cash Counter Payment */}
          <div className="f">
            <label>Payment Method</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'var(--portal-bg)',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--status-ok)',
                }}
              />
              <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-ink)' }}>
                Cash Counter Payment (Direct In-Store)
              </span>
            </div>
            <span className="sub" style={{ fontSize: 11.5, marginTop: 4 }}>
              Direct in-person settlement: Advance deposit paid at dispensing desk, balance settled upon spectacle collection.
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 10 }}>
            <button type="button" className="btn s flex-grow-1" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn p flex-grow-1"
              disabled={submitting || Boolean(discountError) || Boolean(paidError)}
            >
              <Check size={16} />
              <span>{submitting ? 'Processing...' : 'Complete Sale'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Zero Advance Deposit Confirmation Popup */}
      {showZeroAdvanceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 59, 80, 0.55)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              padding: 26,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--status-warn)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17 }}>Confirm Zero Advance Deposit</h3>
                <span className="sub" style={{ fontSize: 12 }}>Optical Dispensing Payment Policy</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-ink)' }}>
              No advance deposit has been entered (LKR 0.00). The total order amount of{' '}
              <b className="tabular-nums">LKR {totalAmount.toLocaleString('en-US')}</b> will remain as outstanding
              balance payable upon collection.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="btn s"
                onClick={() => setShowZeroAdvanceModal(false)}
                disabled={submitting}
              >
                Go Back &amp; Enter Advance
              </button>
              <button
                type="button"
                className="btn p"
                onClick={executeSaleSubmission}
                disabled={submitting}
              >
                <Check size={16} />
                <span>Confirm &amp; Proceed (LKR 0 Advance)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
