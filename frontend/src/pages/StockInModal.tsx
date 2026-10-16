import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Check, AlertCircle, X, Layers, Building, Hash } from 'lucide-react';
import { Supplier } from '../types';

export interface PreselectedProduct {
  id: number;
  type: 'FRAME' | 'LENS' | 'ACCESSORY';
  name: string;
  code: string;
  price?: number;
  supplier_id?: number;
  supplier_name?: string;
}

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialProduct?: PreselectedProduct | null;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialProduct,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [itemType, setItemType] = useState<'FRAME' | 'LENS' | 'ACCESSORY'>('FRAME');
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(10);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productList, setProductList] = useState<{
    id: number;
    name: string;
    code: string;
    type: 'FRAME' | 'LENS' | 'ACCESSORY';
    selling_price: number;
    supplier_id?: number;
    supplier_name?: string;
  }[]>([]);

  // Load suppliers and inventory catalog when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Fetch suppliers
    api.get<{ suppliers: Supplier[] }>('/products/suppliers')
      .then((sRes) => {
        const supps = sRes.suppliers || [];
        setSuppliers(supps);
        if (supps.length > 0 && !selectedSupplierName) {
          setSelectedSupplierName(supps[0].name);
        }
      })
      .catch((err) => console.error('Failed to load suppliers:', err));

    // Fetch inventory items with supplier details
    api.get<{ items: any[] }>('/inventory/status?status=ALL')
      .then((res) => {
        if (res.items && Array.isArray(res.items)) {
          const mapped = res.items.map((i: any) => ({
            id: Number(i.id),
            name: i.item_name || i.name || '',
            code: i.item_code || i.code || '',
            type: (i.item_type || i.product_type || 'FRAME') as 'FRAME' | 'LENS' | 'ACCESSORY',
            selling_price: Number(i.selling_price || 0),
            supplier_id: i.supplier_id ? Number(i.supplier_id) : undefined,
            supplier_name: i.supplier_name || undefined,
          }));
          setProductList(mapped);

          // If initialProduct is supplied from a row click
          if (initialProduct) {
            setItemType(initialProduct.type);
            setSelectedProductId(initialProduct.id);
            setCostPrice(0);
            if (initialProduct.supplier_name) {
              setSelectedSupplierName(initialProduct.supplier_name);
            }
          } else {
            const first = mapped.find((m) => m.type === itemType);
            if (first) {
              setSelectedProductId(first.id);
              setCostPrice(0);
              if (first.supplier_name) {
                setSelectedSupplierName(first.supplier_name);
              }
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load products for stock-in:', err));
  }, [isOpen, initialProduct]);

  // When initialProduct changes after mount
  useEffect(() => {
    if (initialProduct && isOpen) {
      setItemType(initialProduct.type);
      setSelectedProductId(initialProduct.id);
      setCostPrice(0);
      if (initialProduct.supplier_name) {
        setSelectedSupplierName(initialProduct.supplier_name);
      }
    }
  }, [initialProduct, isOpen]);

  // When switching item classification tab in general stock-in mode
  const handleTypeChange = (newType: 'FRAME' | 'LENS' | 'ACCESSORY') => {
    setItemType(newType);
    const matching = productList.filter((p) => p.type === newType);
    if (matching.length > 0) {
      const first = matching[0];
      setSelectedProductId(first.id);
      if (first.selling_price !== undefined) {
        setCostPrice(Number(first.selling_price));
      }
      if (first.supplier_name) {
        setSelectedSupplierName(first.supplier_name);
      }
    }
  };

  // When selecting a product, automatically select its supplier and exact fetched unit price
  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    const found = productList.find((p) => p.id === productId && p.type === itemType);
    if (found) {
      if (found.supplier_name) {
        setSelectedSupplierName(found.supplier_name);
      }
      if (found.selling_price !== undefined) {
        setCostPrice(Number(found.selling_price));
      }
    }
  };

  if (!isOpen) return null;

  const currentProducts = productList.filter((p) => p.type === itemType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantity <= 0) {
      setError('Quantity received must be greater than zero.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/inventory/stock-in', {
        product_type: itemType,
        item_type: itemType,
        product_id: Number(selectedProductId),
        item_id: Number(selectedProductId),
        quantity: Number(quantity),
        unit_cost: Number(costPrice) || 0,
        supplier_reference: invoiceRef || selectedSupplierName || 'DIRECT_RECEIPT',
        supplier_name: selectedSupplierName,
        reason: notes || (invoiceRef ? `Supplier shipment [${selectedSupplierName}] Inv: ${invoiceRef}` : `Replenishment from ${selectedSupplierName}`),
        notes: notes || (invoiceRef ? `Supplier shipment [${selectedSupplierName}] Inv: ${invoiceRef}` : `Replenishment from ${selectedSupplierName}`),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to record stock-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="op-modal-backdrop" onClick={onClose}>
      <div className="op-modal-card op-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="op-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                background: 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <h2 className="op-modal-title">Record Stock-In Replenishment</h2>
              <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary, #64748B)' }}>
                Receive stock shipments into live inventory & update movement ledger
              </div>
            </div>
          </div>
          <button type="button" className="btn g sm" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="op-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div className="note n-warn">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Item Category: If clicked directly from row, lock and hide other categories */}
          {initialProduct ? (
            <div className="f">
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                Item Classification
              </label>
              <div className="in ro" style={{ background: 'rgba(241, 245, 249, 0.7)' }}>
                <span className="badge b-info" style={{ fontWeight: 700 }}>
                  {itemType === 'FRAME' ? 'Spectacle Frame' : itemType === 'LENS' ? 'Ophthalmic Lens' : 'Optical Accessory'}
                </span>
              </div>
            </div>
          ) : (
            <div className="f">
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                Item Classification Category
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className={`btn sm ${itemType === 'FRAME' ? 'p' : 's'}`}
                  onClick={() => handleTypeChange('FRAME')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Spectacle Frames
                </button>
                <button
                  type="button"
                  className={`btn sm ${itemType === 'LENS' ? 'p' : 's'}`}
                  onClick={() => handleTypeChange('LENS')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Ophthalmic Lenses
                </button>
                <button
                  type="button"
                  className={`btn sm ${itemType === 'ACCESSORY' ? 'p' : 's'}`}
                  onClick={() => handleTypeChange('ACCESSORY')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Optical Accessories
                </button>
              </div>
            </div>
          )}

          {/* Product Selector: Clean name/description only without supplier name */}
          <div className="f">
            <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
              Select Product / Item to Restock <span className="req">*</span>
            </label>
            <div className="in">
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(Number(e.target.value))}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13.5 }}
                required
                disabled={Boolean(initialProduct)}
              >
                {initialProduct ? (
                  <option value={initialProduct.id}>
                    {initialProduct.code} — {initialProduct.name}
                  </option>
                ) : currentProducts.length > 0 ? (
                  currentProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))
                ) : (
                  <option value={0}>No {itemType.toLowerCase()} products found</option>
                )}
              </select>
            </div>
          </div>

          {/* Supplier & Supplier Bill / Invoice Ref */}
          <div className="row" style={{ gap: 14 }}>
            <div className="f" style={{ flex: 1.2 }}>
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                Supplier <span className="req">*</span>
              </label>
              <div className="in">
                <select
                  value={selectedSupplierName}
                  onChange={(e) => setSelectedSupplierName(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13.5 }}
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.supplier_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="f" style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                Supplier Bill / Invoice Ref
              </label>
              <div className="in">
                <input
                  type="text"
                  placeholder="e.g. LO-2026-904"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13.5 }}
                />
              </div>
            </div>
          </div>

          {/* Quantity & Exact Unit Price (Editable) */}
          <div className="row" style={{ gap: 14 }}>
            <div className="f" style={{ flex: 1 }}>
              <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
                Quantity Received (Units/Pairs) <span className="req">*</span>
              </label>
              <div className="in">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  required
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 14, fontWeight: 700 }}
                />
              </div>
            </div>

            <div className="f" style={{ flex: 1.3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>
                  Wholesale Unit Cost (LKR) <span className="req">*</span>
                </label>
                {(() => {
                  const selProd: any = initialProduct || productList.find((p) => p.id === selectedProductId);
                  const retPrice = Number(selProd?.selling_price || selProd?.price || 0);
                  return retPrice > 0 ? (
                    <span style={{ fontSize: 11.5, color: 'var(--text-sub, #64748B)' }}>
                      Retail: <b>LKR {retPrice.toLocaleString()}</b>
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="in">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 12000"
                  value={costPrice || ''}
                  onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 14, fontWeight: 700 }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Live Margin & Markup Indicator */}
          {(() => {
            const selProd: any = initialProduct || productList.find((p) => p.id === selectedProductId);
            const retPrice = Number(selProd?.selling_price || selProd?.price || 0);
            if (!retPrice) return null;
            const marginPct = retPrice > 0 && costPrice > 0 ? Math.round(((retPrice - costPrice) / retPrice) * 100) : 0;
            const profitPerUnit = retPrice - costPrice;

            if (costPrice >= retPrice && costPrice > 0) {
              return (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    fontSize: 12,
                    color: '#92400E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>⚠️</span>
                  <span>
                    <b>0% Margin Notice:</b> Wholesale purchase cost (LKR {costPrice.toLocaleString()}) equals retail price. Wholesale invoice cost is usually lower than patient selling price.
                  </span>
                </div>
              );
            }

            if (costPrice > 0) {
              return (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    fontSize: 12,
                    color: '#065F46',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    ✓ <b>Estimated Gross Margin: {marginPct}%</b>
                  </span>
                  <span>Gross profit: LKR {profitPerUnit.toLocaleString()} / unit</span>
                </div>
              );
            }

            return null;
          })()}

          {/* Total Cost Calculation Display */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(15, 118, 110, 0.08)',
              border: '1px solid rgba(15, 118, 110, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-primary-navy, #1E293B)' }}>
              Total Shipment Replenishment Value:
            </span>
            <b style={{ color: '#059669', fontSize: 17, fontWeight: 800 }}>
              LKR {(quantity * costPrice).toLocaleString('en-US')}
            </b>
          </div>

          {/* Shipment Notes */}
          <div className="f">
            <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, display: 'block' }}>
              Shipment Notes / Batch Reference (Optional)
            </label>
            <div className="in">
              <input
                type="text"
                placeholder="e.g. Courier delivery Kalmunai branch, inspected and verified"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="op-modal-footer">
            <button type="button" className="btn s" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn p" disabled={loading}>
              <Check size={16} />
              <span>{loading ? 'Recording Stock-In...' : 'Confirm Stock-In Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
