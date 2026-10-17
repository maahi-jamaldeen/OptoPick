import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Frame, Lens, Accessory, Supplier } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { Glasses, Plus, Search, Layers, Package, AlertCircle, X, Check, Edit2, Calendar, Eye, Tag, Building, Info } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'frames' | 'lenses' | 'accessories'>('frames');
  const [frames, setFrames] = useState<Frame[]>([]);
  const [lenses, setLenses] = useState<Lens[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Item for Accessory Side Panel (Kept strictly for Accessories per user request)
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);

  // Modal Viewers for Frames and Lenses (Smooth popup windows replacing side panel)
  const [viewingFrame, setViewingFrame] = useState<Frame | null>(null);
  const [viewingLens, setViewingLens] = useState<Lens | null>(null);

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<{
    type: 'FRAME' | 'LENS' | 'ACCESSORY';
    data: any;
  } | null>(null);

  // Form State for Add Frame
  const [frameCode, setFrameCode] = useState('');
  const [frameBrand, setFrameBrand] = useState('');
  const [frameModel, setFrameModel] = useState('');
  const [frameShape, setFrameShape] = useState('Rectangular');
  const [frameColor, setFrameColor] = useState('Black');
  const [frameMaterial, setFrameMaterial] = useState('Acetate');
  const [frameSize, setFrameSize] = useState('52-18-140');
  const [framePrice, setFramePrice] = useState('');
  const [frameSupplierId, setFrameSupplierId] = useState<number>(1);
  const [frameStock, setFrameStock] = useState('5');
  const [frameThreshold, setFrameThreshold] = useState('2');

  // Form State for Add Lens
  const [lensCode, setLensCode] = useState('');
  const [lensBrand, setLensBrand] = useState('Essilor');
  const [lensDesign, setLensDesign] = useState<'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE'>('SINGLE_VISION');
  const [lensMaterial, setLensMaterial] = useState('CR-39 Standard Plastic');
  const [lensIndex, setLensIndex] = useState('1.56');
  const [lensCoatings, setLensCoatings] = useState('Anti-Reflective & Hard Coat');
  const [minSph, setMinSph] = useState('-6.00');
  const [maxSph, setMaxSph] = useState('6.00');
  const [minCyl, setMinCyl] = useState('-2.00');
  const [maxCyl, setMaxCyl] = useState('2.00');
  const [lensPrice, setLensPrice] = useState('');
  const [lensSupplierId, setLensSupplierId] = useState<number>(1);
  const [lensStock, setLensStock] = useState('10');
  const [lensThreshold, setLensThreshold] = useState('2');

  // Form State for Add Accessory
  const [accCode, setAccCode] = useState('ACC-');
  const [accName, setAccName] = useState('');
  const [accPrice, setAccPrice] = useState('');
  const [accStock, setAccStock] = useState('10');
  const [accThreshold, setAccThreshold] = useState('5');
  const [accSupplierId, setAccSupplierId] = useState<number>(1);

  // Edit State (Single shared controlled state)
  const [editCode, setEditCode] = useState('');
  const [editBrandOrName, setEditBrandOrName] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editShape, setEditShape] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editMaterial, setEditMaterial] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSupplierId, setEditSupplierId] = useState<number>(1);
  const [editThreshold, setEditThreshold] = useState('2');
  const [editStock, setEditStock] = useState('0');

  // Lens specific edit fields
  const [editDesign, setEditDesign] = useState<'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE'>('SINGLE_VISION');
  const [editIndex, setEditIndex] = useState('1.56');
  const [editCoatings, setEditCoatings] = useState('');
  const [editMinSph, setEditMinSph] = useState('-6.00');
  const [editMaxSph, setEditMaxSph] = useState('6.00');
  const [editMinCyl, setEditMinCyl] = useState('-2.00');
  const [editMaxCyl, setEditMaxCyl] = useState('2.00');

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [fRes, lRes, aRes, sRes] = await Promise.all([
        api.get<{ frames: Frame[] }>('/products/frames'),
        api.get<{ lenses: Lens[] }>('/products/lenses'),
        api.get<{ accessories: Accessory[] }>('/products/accessories'),
        api.get<{ suppliers: Supplier[] }>('/products/suppliers'),
      ]);
      setFrames(fRes.frames || []);
      setLenses(lRes.lenses || []);
      setAccessories(aRes.accessories || []);
      setSuppliers(sRes.suppliers || []);

      if (sRes.suppliers && sRes.suppliers.length > 0) {
        const firstSuppId = sRes.suppliers[0].id;
        setFrameSupplierId(firstSuppId);
        setLensSupplierId(firstSuppId);
        setAccSupplierId(firstSuppId);
      }
      if (aRes.accessories && aRes.accessories.length > 0 && !selectedAccessory) {
        setSelectedAccessory(aRes.accessories[0]);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (activeTab === 'frames') {
        await api.post('/products/frames', {
          frame_code: frameCode.trim(),
          brand: frameBrand.trim(),
          model_name: frameModel.trim(),
          shape: frameShape.trim(),
          color: frameColor.trim(),
          material: frameMaterial.trim(),
          size: frameSize.trim(),
          selling_price: parseFloat(framePrice),
          supplier_id: frameSupplierId,
          stock_quantity: parseInt(frameStock, 10) || 0,
          low_stock_threshold: parseInt(frameThreshold, 10) || 2,
        });
        setFrameCode('');
        setFrameBrand('');
        setFrameModel('');
        setFramePrice('');
      } else if (activeTab === 'lenses') {
        await api.post('/products/lenses', {
          lens_code: lensCode.trim(),
          brand: lensBrand.trim(),
          design_type: lensDesign,
          material: lensMaterial.trim(),
          refractive_index: parseFloat(lensIndex),
          coatings: lensCoatings.trim(),
          min_sph: parseFloat(minSph),
          max_sph: parseFloat(maxSph),
          min_cyl: parseFloat(minCyl),
          max_cyl: parseFloat(maxCyl),
          selling_price: parseFloat(lensPrice),
          supplier_id: lensSupplierId || frameSupplierId,
          stock_quantity: parseInt(lensStock, 10) || 0,
          low_stock_threshold: parseInt(lensThreshold, 10) || 2,
        });
        setLensCode('');
        setLensPrice('');
      } else if (activeTab === 'accessories') {
        await api.post('/products/accessories', {
          item_code: accCode.trim(),
          name: accName.trim(),
          selling_price: parseFloat(accPrice),
          supplier_id: accSupplierId || frameSupplierId,
          stock_quantity: parseInt(accStock, 10) || 0,
          low_stock_threshold: parseInt(accThreshold, 10) || 5,
        });
        setAccCode('ACC-');
        setAccName('');
        setAccPrice('');
      }
      setShowAddModal(false);
      fetchCatalog();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (type: 'FRAME' | 'LENS' | 'ACCESSORY', item: any) => {
    setError(null);
    setEditingProduct({ type, data: item });

    if (type === 'FRAME') {
      setEditCode(item.frame_code || '');
      setEditBrandOrName(item.brand || '');
      setEditModel(item.model_name || '');
      setEditShape(item.shape || '');
      setEditColor(item.color || '');
      setEditMaterial(item.material || '');
      setEditSize(item.size || '');
      setEditPrice(String(item.selling_price || ''));
      setEditSupplierId(item.supplier_id || 1);
      setEditThreshold(String(item.low_stock_threshold || 2));
      setEditStock(String(item.stock_quantity || 0));
    } else if (type === 'LENS') {
      setEditCode(item.lens_code || '');
      setEditBrandOrName(item.brand || '');
      setEditDesign(item.design_type || 'SINGLE_VISION');
      setEditMaterial(item.material || '');
      setEditIndex(String(item.refractive_index || '1.56'));
      setEditCoatings(item.coatings || '');
      setEditMinSph(String(item.min_sph ?? '-6.00'));
      setEditMaxSph(String(item.max_sph ?? '6.00'));
      setEditMinCyl(String(item.min_cyl ?? '-2.00'));
      setEditMaxCyl(String(item.max_cyl ?? '2.00'));
      setEditPrice(String(item.selling_price || ''));
      setEditSupplierId(item.supplier_id || 1);
      setEditThreshold(String(item.low_stock_threshold || 2));
      setEditStock(String(item.stock_quantity || 0));
    } else if (type === 'ACCESSORY') {
      setEditCode(item.item_code || '');
      setEditBrandOrName(item.name || '');
      setEditPrice(String(item.selling_price || ''));
      setEditSupplierId(item.supplier_id || 1);
      setEditThreshold(String(item.low_stock_threshold || 5));
      setEditStock(String(item.stock_quantity || 0));
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setError(null);
    setSubmitting(true);

    try {
      const { type, data } = editingProduct;
      if (type === 'FRAME') {
        await api.put(`/products/frames/${data.id}`, {
          frame_code: editCode.trim(),
          brand: editBrandOrName.trim(),
          model_name: editModel.trim(),
          shape: editShape.trim(),
          color: editColor.trim(),
          material: editMaterial.trim(),
          size: editSize.trim(),
          selling_price: parseFloat(editPrice),
          supplier_id: editSupplierId,
          low_stock_threshold: parseInt(editThreshold, 10) || 2,
        });
      } else if (type === 'LENS') {
        await api.put(`/products/lenses/${data.id}`, {
          lens_code: editCode.trim(),
          brand: editBrandOrName.trim(),
          design_type: editDesign,
          material: editMaterial.trim(),
          refractive_index: parseFloat(editIndex),
          coatings: editCoatings.trim(),
          min_sph: parseFloat(editMinSph),
          max_sph: parseFloat(editMaxSph),
          min_cyl: parseFloat(editMinCyl),
          max_cyl: parseFloat(editMaxCyl),
          selling_price: parseFloat(editPrice),
          supplier_id: editSupplierId,
          low_stock_threshold: parseInt(editThreshold, 10) || 2,
        });
      } else if (type === 'ACCESSORY') {
        await api.put(`/products/accessories/${data.id}`, {
          item_code: editCode.trim(),
          name: editBrandOrName.trim(),
          selling_price: parseFloat(editPrice),
          supplier_id: editSupplierId,
          low_stock_threshold: parseInt(editThreshold, 10) || 5,
        });
      }

      setEditingProduct(null);
      setViewingFrame(null);
      setViewingLens(null);
      fetchCatalog();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to update product.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFrames = frames.filter((f) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.brand?.toLowerCase().includes(q) || f.model_name?.toLowerCase().includes(q) || f.frame_code?.toLowerCase().includes(q);
  });

  const filteredLenses = lenses.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.brand?.toLowerCase().includes(q) || l.lens_code?.toLowerCase().includes(q) || l.design_type?.toLowerCase().includes(q);
  });

  const filteredAccessories = accessories.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.name?.toLowerCase().includes(q) || a.item_code?.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Tab Selector & Add Button */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'frames' ? 'on' : ''}`}
            onClick={() => setActiveTab('frames')}
          >
            Frames ({frames.length})
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'lenses' ? 'on' : ''}`}
            onClick={() => setActiveTab('lenses')}
          >
            Spectacle Lenses ({lenses.length})
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'accessories' ? 'on' : ''}`}
            onClick={() => setActiveTab('accessories')}
          >
            Accessories ({accessories.length})
          </button>
        </div>

        <button type="button" className="btn p" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add {activeTab === 'frames' ? 'Frame' : activeTab === 'lenses' ? 'Lens' : 'Accessory'}
        </button>
      </div>

      {/* Search Input Bar */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="in" style={{ flex: 1, maxWidth: 380 }}>
          <Search size={16} color="var(--rf-text-muted)" />
          <input
            type="text"
            placeholder={`Search ${activeTab} by brand, code, model...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13, color: 'inherit' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--rf-text-muted)' }}>
          <div className="sub">Loading product catalog and optical inventory...</div>
        </div>
      ) : (
        <div className="row" style={{ alignItems: 'flex-start' }}>
          {/* Main Table Card (Full width for Frames & Lenses, flex: 1.5 for Accessories with side panel) */}
          <div
            className="card"
            style={{
              flex: activeTab === 'accessories' ? 1.5 : 1,
              width: activeTab === 'accessories' ? undefined : '100%',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <div className="ch" style={{ padding: '18px 20px 10px', margin: 0 }}>
              <div>
                <h2 style={{ fontSize: 18, margin: 0 }}>
                  {activeTab === 'frames' ? 'Spectacle Frames' : activeTab === 'lenses' ? 'Optical Lens Catalog' : 'Optical Accessories'}
                </h2>
                <div className="sub">
                  {activeTab === 'frames'
                    ? 'Click any frame row to inspect full specifications in a popup window and edit values.'
                    : activeTab === 'lenses'
                    ? 'Click any lens row to view Rx power parameters and manufacturer details in a popup.'
                    : 'Real-time stock quantities and retail pricing in LKR'}
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {activeTab === 'frames' && (
                <table>
                  <thead>
                    <tr>
                      <th>Frame Code</th>
                      <th>Brand & Model</th>
                      <th>Shape & Material</th>
                      <th>Color & Size</th>
                      <th className="num">Price (LKR)</th>
                      <th className="num">Stock</th>
                      <th>Date Added</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFrames.map((f) => (
                      <tr
                        key={f.id}
                        onClick={() => setViewingFrame(f)}
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                        title="Click to view frame details popup"
                      >
                        <td style={{ fontWeight: 700, color: 'var(--rf-primary)' }}>{f.frame_code}</td>
                        <td>
                          <b>{f.brand}</b> — {f.model_name}
                        </td>
                        <td>{f.shape} · {f.material}</td>
                        <td className="sub">{f.color} ({f.size})</td>
                        <td className="num" style={{ fontWeight: 600 }}>{Number(f.selling_price).toLocaleString()}</td>
                        <td className="num" style={{ fontWeight: 700 }}>{f.stock_quantity}</td>
                        <td className="sub" style={{ fontSize: 12 }}>
                          {formatDate(f.created_at)}
                        </td>
                        <td>
                          <StatusBadge
                            status={f.stock_quantity === 0 ? 'CRITICAL' : f.stock_quantity <= f.low_stock_threshold ? 'WARNING' : 'ACTIVE'}
                            label={f.stock_quantity === 0 ? 'Out of Stock' : f.stock_quantity <= f.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn s sm"
                            style={{ padding: '4px 8px', fontSize: 11.5, gap: 4 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal('FRAME', f);
                            }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'lenses' && (
                <table>
                  <thead>
                    <tr>
                      <th>Lens Code</th>
                      <th>Brand & Design</th>
                      <th>Index & Material</th>
                      <th>Supported Rx Range</th>
                      <th className="num">Price / Pair</th>
                      <th className="num">Stock</th>
                      <th>Date Added</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLenses.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => setViewingLens(l)}
                        style={{ cursor: 'pointer', transition: 'background 0.15s ease' }}
                        title="Click to view lens details popup"
                      >
                        <td style={{ fontWeight: 700, color: 'var(--rf-primary)' }}>{l.lens_code}</td>
                        <td>
                          <b>{l.brand}</b>
                          <span className="badge b-ai" style={{ marginLeft: 6, fontSize: 11 }}>
                            {l.design_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>{l.refractive_index} · {l.material}</td>
                        <td className="sub" style={{ fontSize: 12 }}>
                          SPH: [{l.min_sph > 0 ? `+${l.min_sph}` : l.min_sph} to {l.max_sph > 0 ? `+${l.max_sph}` : l.max_sph}]<br />
                          CYL: [{l.min_cyl} to {l.max_cyl}]
                        </td>
                        <td className="num" style={{ fontWeight: 600 }}>{Number(l.selling_price).toLocaleString()}</td>
                        <td className="num" style={{ fontWeight: 700 }}>{l.stock_quantity}</td>
                        <td className="sub" style={{ fontSize: 12 }}>
                          {formatDate(l.created_at)}
                        </td>
                        <td>
                          <StatusBadge
                            status={l.stock_quantity === 0 ? 'CRITICAL' : l.stock_quantity <= l.low_stock_threshold ? 'WARNING' : 'ACTIVE'}
                            label={l.stock_quantity === 0 ? 'Out of Stock' : l.stock_quantity <= l.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn s sm"
                            style={{ padding: '4px 8px', fontSize: 11.5, gap: 4 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal('LENS', l);
                            }}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'accessories' && (
                <table>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Description</th>
                      <th>Supplier</th>
                      <th className="num">Price (LKR)</th>
                      <th className="num">Stock</th>
                      <th>Date Added</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccessories.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedAccessory(a)}
                        style={{
                          cursor: 'pointer',
                          background: selectedAccessory?.id === a.id ? 'var(--rf-glass-bg)' : undefined,
                        }}
                      >
                        <td style={{ fontWeight: 700, color: 'var(--rf-primary)' }}>{a.item_code}</td>
                        <td><b>{a.name}</b></td>
                        <td className="sub">{a.supplier_name || 'Standard Vendor'}</td>
                        <td className="num" style={{ fontWeight: 600 }}>{Number(a.selling_price).toLocaleString()}</td>
                        <td className="num" style={{ fontWeight: 700 }}>{a.stock_quantity}</td>
                        <td className="sub" style={{ fontSize: 12 }}>
                          {formatDate(a.created_at)}
                        </td>
                        <td>
                          <StatusBadge
                            status={a.stock_quantity === 0 ? 'CRITICAL' : a.stock_quantity <= a.low_stock_threshold ? 'WARNING' : 'ACTIVE'}
                            label={a.stock_quantity === 0 ? 'Out of Stock' : a.stock_quantity <= a.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Column: Accessory Detail Panel ONLY (Kept for accessories as requested) */}
          {activeTab === 'accessories' && selectedAccessory && (
            <div className="card col" style={{ width: 330, gap: 14 }}>
              <div className="ch" style={{ margin: 0 }}>
                <h2 style={{ fontSize: 17 }}>Accessory Details</h2>
                <span className="r">
                  <span className="badge b-ok">{selectedAccessory.item_code}</span>
                </span>
              </div>

              <div className="f">
                <label>Item Description</label>
                <div className="in ro">{selectedAccessory.name}</div>
              </div>

              <div className="row" style={{ gap: 10 }}>
                <div className="f">
                  <label>Selling Price</label>
                  <div className="in ro num" style={{ fontWeight: 700 }}>
                    LKR {Number(selectedAccessory.selling_price).toLocaleString()}
                  </div>
                </div>
                <div className="f">
                  <label>In Stock</label>
                  <div className="in ro" style={{ fontWeight: 700, color: 'var(--rf-badge-ok-text)' }}>
                    {selectedAccessory.stock_quantity} units
                  </div>
                </div>
              </div>

              <div className="row" style={{ gap: 10 }}>
                <div className="f">
                  <label>Low-stock alert</label>
                  <div className="in ro">{selectedAccessory.low_stock_threshold} units</div>
                </div>
                <div className="f">
                  <label>Supplier</label>
                  <div className="in ro">{selectedAccessory.supplier_name || 'Standard Vendor'}</div>
                </div>
              </div>

              <div className="f">
                <label>Date Added to Inventory</label>
                <div className="in ro" style={{ fontSize: 12.5 }}>
                  {formatDateTime(selectedAccessory.created_at)}
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn p"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => openEditModal('ACCESSORY', selectedAccessory)}
                >
                  <Edit2 size={15} /> Edit Accessory Values
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Frame Detail Popup Modal (Smooth window instead of side column) */}
      {viewingFrame && (
        <div className="op-modal-backdrop" onClick={() => setViewingFrame(null)}>
          <div className="op-modal-card op-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '10px',
                    background: 'rgba(13, 148, 136, 0.12)',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Glasses size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 className="op-modal-title" style={{ margin: 0 }}>
                      {viewingFrame.brand} — {viewingFrame.model_name}
                    </h2>
                    <span className="badge b-ok">{viewingFrame.frame_code}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary, #64748B)' }}>
                    Optical Spectacle Frame Specifications & Stock Status
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn g sm"
                onClick={() => setViewingFrame(null)}
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="op-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Specs Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                <div className="f">
                  <label>Shape</label>
                  <div className="in ro">{viewingFrame.shape}</div>
                </div>
                <div className="f">
                  <label>Material</label>
                  <div className="in ro">{viewingFrame.material}</div>
                </div>
                <div className="f">
                  <label>Color</label>
                  <div className="in ro">{viewingFrame.color}</div>
                </div>
                <div className="f">
                  <label>Eye Size Specification</label>
                  <div className="in ro">{viewingFrame.size}</div>
                </div>
              </div>

              {/* Pricing & Stock Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  padding: '16px',
                  background: 'rgba(241, 245, 249, 0.65)',
                  borderRadius: '12px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Selling Price</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary-navy, #1E293B)', marginTop: 2 }}>
                    LKR {Number(viewingFrame.selling_price).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Stock on Hand</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                    {viewingFrame.stock_quantity} units
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Low Stock Alert</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#D97706', marginTop: 4 }}>
                    &le; {viewingFrame.low_stock_threshold || 2} units
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Status</div>
                  <div style={{ marginTop: 4 }}>
                    <StatusBadge
                      status={viewingFrame.stock_quantity === 0 ? 'CRITICAL' : viewingFrame.stock_quantity <= viewingFrame.low_stock_threshold ? 'WARNING' : 'ACTIVE'}
                      label={viewingFrame.stock_quantity === 0 ? 'Out of Stock' : viewingFrame.stock_quantity <= viewingFrame.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                    />
                  </div>
                </div>
              </div>

              {/* Supplier & Timestamps */}
              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ flex: 1.2 }}>
                  <label>Primary Supplier</label>
                  <div className="in ro">
                    <Building size={14} style={{ marginRight: 6, color: 'var(--rf-text-muted)' }} />
                    {viewingFrame.supplier_name || 'Standard Vendor'}
                  </div>
                </div>

                <div className="f" style={{ flex: 1 }}>
                  <label>Date Added to Catalog</label>
                  <div className="in ro">
                    <Calendar size={14} style={{ marginRight: 6, color: 'var(--rf-text-muted)' }} />
                    {formatDateTime(viewingFrame.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="op-modal-footer">
              <button type="button" className="btn s" onClick={() => setViewingFrame(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn p"
                onClick={() => {
                  const frameToEdit = viewingFrame;
                  setViewingFrame(null);
                  openEditModal('FRAME', frameToEdit);
                }}
              >
                <Edit2 size={15} /> Edit Frame Values
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lens Detail Popup Modal (Smooth window instead of side column) */}
      {viewingLens && (
        <div className="op-modal-backdrop" onClick={() => setViewingLens(null)}>
          <div className="op-modal-card op-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.12)',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 className="op-modal-title" style={{ margin: 0 }}>
                      {viewingLens.brand} — {viewingLens.lens_code}
                    </h2>
                    <span className="badge b-info">Index {viewingLens.refractive_index}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary, #64748B)' }}>
                    Ophthalmic Lens Specifications, Coatings & Supported Rx Power Ranges
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn g sm"
                onClick={() => setViewingLens(null)}
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="op-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Specs Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                <div className="f">
                  <label>Design Classification</label>
                  <div className="in ro">{viewingLens.design_type.replace(/_/g, ' ')}</div>
                </div>
                <div className="f">
                  <label>Refractive Index</label>
                  <div className="in ro">{viewingLens.refractive_index}</div>
                </div>
                <div className="f">
                  <label>Substrate Material</label>
                  <div className="in ro">{viewingLens.material}</div>
                </div>
                <div className="f">
                  <label>Surface Coatings</label>
                  <div className="in ro">{viewingLens.coatings || 'Standard Uncoated'}</div>
                </div>
              </div>

              {/* Supported Power Ranges */}
              <div
                style={{
                  padding: '14px 16px',
                  background: 'rgba(238, 242, 255, 0.7)',
                  borderRadius: '10px',
                  border: '1px solid rgba(199, 210, 254, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#3730A3', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} /> LensIQ Prescriptive Compatibility Boundaries:
                </div>
                <div className="row" style={{ gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: '#4338CA', fontWeight: 600 }}>Sphere (SPH) Range:</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>
                      {viewingLens.min_sph > 0 ? `+${viewingLens.min_sph}` : viewingLens.min_sph} D to{' '}
                      {viewingLens.max_sph > 0 ? `+${viewingLens.max_sph}` : viewingLens.max_sph} D
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: '#4338CA', fontWeight: 600 }}>Cylinder (CYL) Range:</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B' }}>
                      {viewingLens.min_cyl} D to {viewingLens.max_cyl} D
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  padding: '16px',
                  background: 'rgba(241, 245, 249, 0.65)',
                  borderRadius: '12px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Price Per Pair</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-primary-navy, #1E293B)', marginTop: 2 }}>
                    LKR {Number(viewingLens.selling_price).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Pairs in Stock</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', marginTop: 2 }}>
                    {viewingLens.stock_quantity} pairs
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Low Stock Alert</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#D97706', marginTop: 4 }}>
                    &le; {viewingLens.low_stock_threshold || 2} pairs
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Status</div>
                  <div style={{ marginTop: 4 }}>
                    <StatusBadge
                      status={viewingLens.stock_quantity === 0 ? 'CRITICAL' : viewingLens.stock_quantity <= viewingLens.low_stock_threshold ? 'WARNING' : 'ACTIVE'}
                      label={viewingLens.stock_quantity === 0 ? 'Out of Stock' : viewingLens.stock_quantity <= viewingLens.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                    />
                  </div>
                </div>
              </div>

              {/* Supplier & Timestamps */}
              <div className="row" style={{ gap: 14 }}>
                <div className="f" style={{ flex: 1.2 }}>
                  <label>Primary Supplier</label>
                  <div className="in ro">
                    <Building size={14} style={{ marginRight: 6, color: 'var(--rf-text-muted)' }} />
                    {viewingLens.supplier_name || 'Standard Vendor'}
                  </div>
                </div>

                <div className="f" style={{ flex: 1 }}>
                  <label>Date Added to Catalog</label>
                  <div className="in ro">
                    <Calendar size={14} style={{ marginRight: 6, color: 'var(--rf-text-muted)' }} />
                    {formatDateTime(viewingLens.created_at)}
                  </div>
                </div>
              </div>
            </div>

            <div className="op-modal-footer">
              <button type="button" className="btn s" onClick={() => setViewingLens(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn p"
                onClick={() => {
                  const lensToEdit = viewingLens;
                  setViewingLens(null);
                  openEditModal('LENS', lensToEdit);
                }}
              >
                <Edit2 size={15} /> Edit Lens Values
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal (Fix mistaken saved values) */}
      {editingProduct && (
        <div className="op-modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="op-modal-card op-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="op-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'var(--portal-bg, rgba(30, 41, 59, 0.08))',
                    color: 'var(--primary-action, #1E293B)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color, transparent)',
                  }}
                >
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="op-modal-title">
                    Edit {editingProduct.type === 'FRAME' ? 'Spectacle Frame' : editingProduct.type === 'LENS' ? 'Optical Lens' : 'Accessory'}
                  </h2>
                  <div style={{ fontSize: 12.5, color: 'var(--text-sub, #64748B)' }}>
                    Correct any typographical mistakes or update pricing/thresholds
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn g sm"
                onClick={() => setEditingProduct(null)}
                style={{ padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="op-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div className="note n-bad">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* FRAME EDIT */}
              {editingProduct.type === 'FRAME' && (
                <>
                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Frame Code <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Brand <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          value={editBrandOrName}
                          onChange={(e) => setEditBrandOrName(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Model Name <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          value={editModel}
                          onChange={(e) => setEditModel(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Shape</label>
                      <div className="in">
                        <input
                          type="text"
                          value={editShape}
                          onChange={(e) => setEditShape(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Color</label>
                      <div className="in">
                        <input
                          type="text"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Material</label>
                      <div className="in">
                        <input
                          type="text"
                          value={editMaterial}
                          onChange={(e) => setEditMaterial(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Size</label>
                      <div className="in">
                        <input
                          type="text"
                          value={editSize}
                          onChange={(e) => setEditSize(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Selling Price (LKR) <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Low Stock Alert Threshold</label>
                      <div className="in">
                        <input
                          type="number"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(e.target.value)}
                          required
                          min="1"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Primary Supplier <span className="req">*</span></label>
                      <div className="in">
                        <select
                          value={editSupplierId}
                          onChange={(e) => setEditSupplierId(parseInt(e.target.value, 10))}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-ink)', cursor: 'pointer' }}
                        >
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.supplier_code})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* LENS EDIT */}
              {editingProduct.type === 'LENS' && (
                <>
                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Lens Code <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Brand <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          value={editBrandOrName}
                          onChange={(e) => setEditBrandOrName(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Design Type</label>
                      <div className="in">
                        <select
                          value={editDesign}
                          onChange={(e: any) => setEditDesign(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-ink)', cursor: 'pointer' }}
                        >
                          <option value="SINGLE_VISION">Single Vision</option>
                          <option value="BIFOCAL">Bifocal</option>
                          <option value="PROGRESSIVE">Progressive</option>
                        </select>
                      </div>
                    </div>
                    <div className="f">
                      <label>Refractive Index</label>
                      <div className="in">
                        <input
                          type="text"
                          value={editIndex}
                          onChange={(e) => setEditIndex(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Material</label>
                      <div className="in">
                        <input
                          type="text"
                          value={editMaterial}
                          onChange={(e) => setEditMaterial(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Coatings</label>
                      <div className="in">
                        <input
                          type="text"
                          value={editCoatings}
                          onChange={(e) => setEditCoatings(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>SPH Range (Min to Max)</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className="in" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={editMinSph}
                            onChange={(e) => setEditMinSph(e.target.value)}
                            placeholder="Min"
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                        <div className="in" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={editMaxSph}
                            onChange={(e) => setEditMaxSph(e.target.value)}
                            placeholder="Max"
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="f">
                      <label>CYL Range (Min to Max)</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className="in" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={editMinCyl}
                            onChange={(e) => setEditMinCyl(e.target.value)}
                            placeholder="Min"
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                        <div className="in" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={editMaxCyl}
                            onChange={(e) => setEditMaxCyl(e.target.value)}
                            placeholder="Max"
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Price / Pair (LKR) <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Low Stock Threshold</label>
                      <div className="in">
                        <input
                          type="number"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(e.target.value)}
                          required
                          min="1"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="f">
                    <label>Supplier <span className="req">*</span></label>
                    <div className="in">
                      <select
                        value={editSupplierId}
                        onChange={(e) => setEditSupplierId(parseInt(e.target.value, 10))}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-ink)', cursor: 'pointer' }}
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.supplier_code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ACCESSORY EDIT */}
              {editingProduct.type === 'ACCESSORY' && (
                <>
                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Item Code <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Accessory Name <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          value={editBrandOrName}
                          onChange={(e) => setEditBrandOrName(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Selling Price (LKR) <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Low Stock Alert Threshold</label>
                      <div className="in">
                        <input
                          type="number"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(e.target.value)}
                          required
                          min="1"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="f">
                    <label>Supplier <span className="req">*</span></label>
                    <div className="in">
                      <select
                        value={editSupplierId}
                        onChange={(e) => setEditSupplierId(parseInt(e.target.value, 10))}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-ink)', cursor: 'pointer' }}
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.supplier_code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="op-modal-footer">
                <button type="button" className="btn s" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn p" disabled={submitting}>
                  <Check size={16} />
                  <span>{submitting ? 'Updating...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(18, 59, 80, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px 16px',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              margin: 'auto',
            }}
          >
            <div className="ch" style={{ margin: 0 }}>
              <h2 style={{ fontSize: 18 }}>
                Add New {activeTab === 'frames' ? 'Frame' : activeTab === 'lenses' ? 'Lens' : 'Accessory'}
              </h2>
              <span className="r">
                <button
                  type="button"
                  className="btn g sm"
                  onClick={() => setShowAddModal(false)}
                  style={{ border: 'none', padding: 4 }}
                >
                  <X size={18} />
                </button>
              </span>
            </div>

            {error && (
              <div className="note n-bad">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeTab === 'frames' && (
                <>
                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Frame Code <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          placeholder="FRM-RB-5154"
                          value={frameCode}
                          onChange={(e) => setFrameCode(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Brand <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          placeholder="Ray-Ban"
                          value={frameBrand}
                          onChange={(e) => setFrameBrand(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Model Name <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          placeholder="Clubmaster Classic"
                          value={frameModel}
                          onChange={(e) => setFrameModel(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Shape</label>
                      <div className="in">
                        <input
                          type="text"
                          value={frameShape}
                          onChange={(e) => setFrameShape(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Color</label>
                      <div className="in">
                        <input
                          type="text"
                          value={frameColor}
                          onChange={(e) => setFrameColor(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Material</label>
                      <div className="in">
                        <input
                          type="text"
                          value={frameMaterial}
                          onChange={(e) => setFrameMaterial(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Size</label>
                      <div className="in">
                        <input
                          type="text"
                          value={frameSize}
                          onChange={(e) => setFrameSize(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Selling Price (LKR) <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="number"
                          placeholder="18500.00"
                          value={framePrice}
                          onChange={(e) => setFramePrice(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Initial Stock</label>
                      <div className="in">
                        <input
                          type="number"
                          value={frameStock}
                          onChange={(e) => setFrameStock(e.target.value)}
                          required
                          min="0"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Low Stock Alert Threshold</label>
                      <div className="in">
                        <input
                          type="number"
                          value={frameThreshold}
                          onChange={(e) => setFrameThreshold(e.target.value)}
                          required
                          min="1"
                          placeholder="2"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="f">
                    <label>Supplier <span className="req">*</span></label>
                    <div className="in">
                      <select
                        value={frameSupplierId}
                        onChange={(e) => setFrameSupplierId(parseInt(e.target.value, 10))}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-ink)', cursor: 'pointer' }}
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.supplier_code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'lenses' && (
                <>
                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Lens Code <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          placeholder="LNS-CRIZ-01"
                          value={lensCode}
                          onChange={(e) => setLensCode(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Brand <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          value={lensBrand}
                          onChange={(e) => setLensBrand(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Design Type</label>
                      <div className="in">
                        <select
                          value={lensDesign}
                          onChange={(e: any) => setLensDesign(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-ink)', cursor: 'pointer' }}
                        >
                          <option value="SINGLE_VISION">Single Vision</option>
                          <option value="BIFOCAL">Bifocal</option>
                          <option value="PROGRESSIVE">Progressive</option>
                        </select>
                      </div>
                    </div>
                    <div className="f">
                      <label>Refractive Index</label>
                      <div className="in">
                        <input
                          type="text"
                          value={lensIndex}
                          onChange={(e) => setLensIndex(e.target.value)}
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>SPH Range (Min to Max)</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className="in" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={minSph}
                            onChange={(e) => setMinSph(e.target.value)}
                            placeholder="Min"
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                        <div className="in" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={maxSph}
                            onChange={(e) => setMaxSph(e.target.value)}
                            placeholder="Max"
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="f">
                      <label>CYL Range (Min to Max)</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div className="in" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={minCyl}
                            onChange={(e) => setMinCyl(e.target.value)}
                            placeholder="Min"
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                        <div className="in" style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={maxCyl}
                            onChange={(e) => setMaxCyl(e.target.value)}
                            placeholder="Max"
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Price / Pair (LKR) <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="number"
                          placeholder="22500.00"
                          value={lensPrice}
                          onChange={(e) => setLensPrice(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Initial Pairs in Stock</label>
                      <div className="in">
                        <input
                          type="number"
                          value={lensStock}
                          onChange={(e) => setLensStock(e.target.value)}
                          required
                          min="0"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Low Stock Threshold</label>
                      <div className="in">
                        <input
                          type="number"
                          value={lensThreshold}
                          onChange={(e) => setLensThreshold(e.target.value)}
                          required
                          min="1"
                          placeholder="2"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="f">
                    <label>Supplier <span className="req">*</span></label>
                    <div className="in">
                      <select
                        value={lensSupplierId}
                        onChange={(e) => setLensSupplierId(parseInt(e.target.value, 10))}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-ink)', cursor: 'pointer' }}
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.supplier_code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'accessories' && (
                <>
                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Item Code <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          placeholder="ACC-SPRAY-01"
                          value={accCode}
                          onChange={(e) => setAccCode(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Accessory Name <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="text"
                          placeholder="Anti-Fog Lens Cleaning Spray (50ml)"
                          value={accName}
                          onChange={(e) => setAccName(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row" style={{ gap: 12 }}>
                    <div className="f">
                      <label>Selling Price (LKR) <span className="req">*</span></label>
                      <div className="in">
                        <input
                          type="number"
                          placeholder="850.00"
                          value={accPrice}
                          onChange={(e) => setAccPrice(e.target.value)}
                          required
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Initial Stock</label>
                      <div className="in">
                        <input
                          type="number"
                          placeholder="10"
                          value={accStock}
                          onChange={(e) => setAccStock(e.target.value)}
                          required
                          min="0"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="f">
                      <label>Low Stock Alert Threshold</label>
                      <div className="in">
                        <input
                          type="number"
                          placeholder="5"
                          value={accThreshold}
                          onChange={(e) => setAccThreshold(e.target.value)}
                          required
                          min="1"
                          style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="f">
                    <label>Supplier <span className="req">*</span></label>
                    <div className="in">
                      <select
                        value={accSupplierId}
                        onChange={(e) => setAccSupplierId(parseInt(e.target.value, 10))}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-ink)', cursor: 'pointer' }}
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.supplier_code})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn s" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn p" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
