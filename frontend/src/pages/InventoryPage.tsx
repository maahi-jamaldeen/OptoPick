import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { InventoryItem, InventoryMovement, GoodsReceipt } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { StockInModal, PreselectedProduct } from './StockInModal';
import { ProductRestockHistoryModal } from './ProductRestockHistoryModal';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  AlertTriangle,
  AlertCircle,
  Search,
  Plus,
  Filter,
  ShieldCheck,
  Building,
  FileText,
  Receipt,
  TrendingUp,
  History,
  Clock,
  ArrowRight,
  Layers,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const [activeView, setActiveView] = useState<'levels' | 'movements' | 'receipts'>('levels');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'FRAME' | 'LENS' | 'ACCESSORY'>('ALL');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState({ totalItems: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementsPage, setMovementsPage] = useState(1);
  const MOVEMENTS_PER_PAGE = 10;
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [goodsReceiptSummary, setGoodsReceiptSummary] = useState({ totalSpend: 0, totalUnits: 0, totalShipments: 0 });
  const [receiptsPage, setReceiptsPage] = useState(1);
  const RECEIPTS_PER_PAGE = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Stock-In Modal State with Pre-selected Product
  const [showStockIn, setShowStockIn] = useState(false);
  const [selectedProductForStockIn, setSelectedProductForStockIn] = useState<PreselectedProduct | null>(null);

  // Per-Product Restock History Lifecycle Modal State
  const [showProductHistory, setShowProductHistory] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ items: InventoryItem[]; summary: any }>(
        `/inventory/status?status=${statusFilter}`
      );
      setItems(res.items || []);
      setSummary(res.summary || { totalItems: 0, lowStockCount: 0, outOfStockCount: 0 });

      const movRes = await api.get<{ movements: InventoryMovement[] }>('/inventory/movements');
      setMovements(movRes.movements || []);

      try {
        const recRes = await api.get<{ receipts: GoodsReceipt[]; summary: any }>('/inventory/goods-receipts');
        setGoodsReceipts(recRes.receipts || []);
        setGoodsReceiptSummary(recRes.summary || { totalSpend: 0, totalUnits: 0, totalShipments: 0 });
      } catch {
        // Fallback gracefully
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter, isAdmin]);

  const filteredItems = items.filter((i) => {
    // Type Filter
    const itemType = (i.item_type || i.product_type || 'FRAME').toUpperCase();
    if (typeFilter !== 'ALL' && itemType !== typeFilter) {
      return false;
    }

    // Search Query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (i.item_name || i.name || '').toLowerCase();
    const code = (i.item_code || i.code || '').toLowerCase();
    const type = itemType.toLowerCase();
    const supp = (i.supplier_name || '').toLowerCase();
    return name.includes(q) || code.includes(q) || type.includes(q) || supp.includes(q);
  });

  const filteredMovements = movements.filter((m) => {
    if (typeFilter !== 'ALL' && m.product_type !== typeFilter) {
      return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (m.item_name || '').toLowerCase();
    const type = (m.movement_type || '').toLowerCase();
    const reason = (m.reason || m.notes || '').toLowerCase();
    const recorder = (m.created_by_name || m.recorded_by || '').toLowerCase();
    return name.includes(q) || type.includes(q) || reason.includes(q) || recorder.includes(q);
  });

  const totalMovementPages = Math.ceil(filteredMovements.length / MOVEMENTS_PER_PAGE) || 1;
  const paginatedMovements = filteredMovements.slice(
    (movementsPage - 1) * MOVEMENTS_PER_PAGE,
    movementsPage * MOVEMENTS_PER_PAGE
  );

  useEffect(() => {
    setMovementsPage(1);
    setReceiptsPage(1);
  }, [searchQuery, typeFilter, activeView]);

  // Pagination for Per-Product Restock History
  const totalReceiptPages = Math.ceil(filteredItems.length / RECEIPTS_PER_PAGE) || 1;
  const paginatedProductReceipts = filteredItems.slice(
    (receiptsPage - 1) * RECEIPTS_PER_PAGE,
    receiptsPage * RECEIPTS_PER_PAGE
  );

  const handleOpenProductHistory = (item: InventoryItem) => {
    setSelectedProductForHistory(item);
    setShowProductHistory(true);
  };

  const handleRecordStockInFromHistory = (item: InventoryItem) => {
    const pType = (item.item_type || item.product_type || 'FRAME') as 'FRAME' | 'LENS' | 'ACCESSORY';
    setSelectedProductForStockIn({
      id: Number(item.id),
      type: pType,
      name: item.item_name || item.name || '',
      code: item.item_code || item.code || '',
      price: Number(item.selling_price || 0),
      supplier_id: item.supplier_id,
      supplier_name: item.supplier_name,
    });
    setShowProductHistory(false);
    setShowStockIn(true);
  };

  const filteredReceipts = goodsReceipts.filter((r) => {
    if (typeFilter !== 'ALL' && r.product_type !== typeFilter) {
      return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = (r.item_name || '').toLowerCase();
    const code = (r.item_code || '').toLowerCase();
    const supp = (r.supplier_name || '').toLowerCase();
    const inv = (r.invoice_ref || '').toLowerCase();
    const recorder = (r.recorded_by || '').toLowerCase();
    return name.includes(q) || code.includes(q) || supp.includes(q) || inv.includes(q) || recorder.includes(q);
  });

  const handleRowClick = (item: InventoryItem) => {
    const pType = (item.item_type || item.product_type || 'FRAME') as 'FRAME' | 'LENS' | 'ACCESSORY';
    setSelectedProductForStockIn({
      id: Number(item.id),
      type: pType,
      name: item.item_name || item.name || '',
      code: item.item_code || item.code || '',
      price: Number(item.selling_price || 0),
      supplier_id: item.supplier_id,
      supplier_name: item.supplier_name,
    });
    setShowStockIn(true);
  };

  const handleOpenGeneralStockIn = () => {
    setSelectedProductForStockIn(null);
    setShowStockIn(true);
  };

  // KPI Computations for Percentage Rails (Exact Match to Image 3 Reference)
  const totalCatalogCount = summary.totalItems || items.length || 0;
  const lowStockCount = summary.lowStockCount || 0;
  const outOfStockCount = summary.outOfStockCount || 0;

  const formatPercent = (count: number, total: number) => {
    if (!total || total <= 0) return '0%';
    const val = (count / total) * 100;
    if (val === 100) return '100%';
    if (val === 0) return '0%';
    return val % 1 === 0 ? `${val}%` : `${val.toFixed(1)}%`;
  };

  const lowStockPctStr = formatPercent(lowStockCount, totalCatalogCount);
  const outOfStockPctStr = formatPercent(outOfStockCount, totalCatalogCount);
  const lowStockPctNum = totalCatalogCount > 0 ? (lowStockCount / totalCatalogCount) * 100 : 0;
  const outOfStockPctNum = totalCatalogCount > 0 ? (outOfStockCount / totalCatalogCount) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 3 Percentage Rail KPI Cards (Exact Match to Reference Picture - Image 3) */}
      <div className="row" style={{ gap: 16 }}>
        {/* Card 1: Total Tracked SKUs */}
        <div className="op-rail-kpi card-blue">
          <div className="op-rail-left">
            <div>
              <div className="op-rail-header">
                <Package size={18} color="#1D4ED8" />
                <span>Total Tracked SKUs</span>
              </div>
              <div className="op-rail-value">{totalCatalogCount}</div>
            </div>
            <div className="op-rail-sub">Real-time inventory catalogue</div>
            <div className="op-rail-footer">
              <span className="op-rail-dot" style={{ background: '#2563EB' }} />
              <span>All inventory</span>
            </div>
          </div>
          <div className="op-rail-right">
            <span className="op-rail-pct" style={{ color: '#1D4ED8' }}>100%</span>
            <div className="op-rail-bar-track" style={{ background: '#0284C7' }}>
              <div
                className="op-rail-bar-fill"
                style={{
                  height: '100%',
                  background: '#0284C7',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Low Stock Warnings */}
        <div className="op-rail-kpi card-amber">
          <div className="op-rail-left">
            <div>
              <div className="op-rail-header">
                <AlertTriangle size={18} color="#D97706" />
                <span>Low Stock Warnings</span>
              </div>
              <div className="op-rail-value">{lowStockCount}</div>
            </div>
            <div className="op-rail-sub">At or below reorder threshold</div>
            <div className="op-rail-footer">
              <span className="op-rail-dot" style={{ background: '#D97706' }} />
              <span>Reorder soon</span>
            </div>
          </div>
          <div className="op-rail-right">
            <span className="op-rail-pct" style={{ color: '#D97706' }}>{lowStockPctStr}</span>
            <div className="op-rail-bar-track" style={{ background: '#F5EEDB' }}>
              <div
                className="op-rail-bar-fill"
                style={{
                  height: `${Math.min(100, Math.max(12, lowStockPctNum))}%`,
                  background: '#D97706',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Out of Stock */}
        <div className="op-rail-kpi card-red">
          <div className="op-rail-left">
            <div>
              <div className="op-rail-header">
                <AlertCircle size={18} color="#DC2626" />
                <span>Out of Stock</span>
              </div>
              <div className="op-rail-value">{outOfStockCount}</div>
            </div>
            <div className="op-rail-sub">Supplier replenishment needed</div>
            <div className="op-rail-footer">
              <span className="op-rail-dot" style={{ background: '#DC2626' }} />
              <span>Action required</span>
            </div>
          </div>
          <div className="op-rail-right">
            <span className="op-rail-pct" style={{ color: '#DC2626' }}>{outOfStockPctStr}</span>
            <div className="op-rail-bar-track" style={{ background: '#FDE8E8' }}>
              <div
                className="op-rail-bar-fill"
                style={{
                  height: `${Math.min(100, Math.max(15, outOfStockPctNum))}%`,
                  background: '#DC2626',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar & View Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeView === 'levels' ? 'on' : ''}`}
            onClick={() => setActiveView('levels')}
          >
            Current Stock Levels
          </button>
          <button
            type="button"
            className={`tab ${activeView === 'movements' ? 'on' : ''}`}
            onClick={() => setActiveView('movements')}
          >
            Movement Audit History
          </button>
          <button
            type="button"
            className={`tab ${activeView === 'receipts' ? 'on' : ''}`}
            onClick={() => setActiveView('receipts')}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Receipt size={14} color="#0D9488" />
            <span>Goods Receipt & Procurement Ledger</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          {/* Status Filter for Current Stock Levels */}
          {activeView === 'levels' && (
            <div className="tabs">
              <button
                type="button"
                className={`tab ${statusFilter === 'ALL' ? 'on' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All Status
              </button>
              <button
                type="button"
                className={`tab ${statusFilter === 'LOW_STOCK' ? 'on' : ''}`}
                onClick={() => setStatusFilter('LOW_STOCK')}
                style={statusFilter === 'LOW_STOCK' ? { color: 'var(--status-warn)', borderColor: 'var(--status-warn-border)' } : undefined}
              >
                Low Stock
              </button>
              <button
                type="button"
                className={`tab ${statusFilter === 'OUT_OF_STOCK' ? 'on' : ''}`}
                onClick={() => setStatusFilter('OUT_OF_STOCK')}
                style={statusFilter === 'OUT_OF_STOCK' ? { color: 'var(--status-bad)', borderColor: 'var(--status-bad-border)' } : undefined}
              >
                Out of Stock
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn p"
            onClick={handleOpenGeneralStockIn}
          >
            <Plus size={16} /> Record Stock-In
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search Input Bar */}
        <div className="in" style={{ flex: 1, minWidth: 260, maxWidth: 380 }}>
          <Search size={16} color="var(--rf-text-muted)" />
          <input
            type="text"
            placeholder={
              activeView === 'receipts'
                ? 'Search receipts by invoice, supplier, product...'
                : 'Search items by name, code, supplier...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13, color: 'inherit' }}
          />
        </div>

        {/* Type Filter Buttons (Frames, Lenses, Accessories) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rf-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={13} /> Classification:
          </span>
          <div className="tabs" style={{ background: 'rgba(148, 163, 184, 0.08)', padding: 3, borderRadius: 8 }}>
            <button
              type="button"
              className={`tab ${typeFilter === 'ALL' ? 'on' : ''}`}
              onClick={() => setTypeFilter('ALL')}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              All Types
            </button>
            <button
              type="button"
              className={`tab ${typeFilter === 'FRAME' ? 'on' : ''}`}
              onClick={() => setTypeFilter('FRAME')}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              Frames
            </button>
            <button
              type="button"
              className={`tab ${typeFilter === 'LENS' ? 'on' : ''}`}
              onClick={() => setTypeFilter('LENS')}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              Lenses
            </button>
            <button
              type="button"
              className={`tab ${typeFilter === 'ACCESSORY' ? 'on' : ''}`}
              onClick={() => setTypeFilter('ACCESSORY')}
              style={{ padding: '4px 12px', fontSize: 12 }}
            >
              Accessories
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--rf-text-muted)' }}>
          <div className="sub">Synchronizing inventory balance and stock ledger...</div>
        </div>
      ) : activeView === 'levels' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ch" style={{ padding: '18px 20px 10px', margin: 0 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Optical Stock Ledger</h2>
              <div className="sub">
                Click any product row below to quickly open <b>Record Stock-In Replenishment</b> pre-filled with that item.
              </div>
            </div>
            <div className="r sub" style={{ fontSize: 12.5 }}>
              {filteredItems.length} items listed
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Product Description</th>
                  <th>Type</th>
                  <th>Primary Supplier</th>
                  <th className="num">Unit Price (LKR)</th>
                  <th className="num">Threshold</th>
                  <th className="num">Current Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 36, color: 'var(--rf-text-muted)' }}>
                      No inventory items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const code = item.item_code || item.code || '-';
                    const name = item.item_name || item.name || 'Unnamed Product';
                    const type = item.item_type || item.product_type || 'FRAME';
                    const supplier = item.supplier_name || 'Standard Supplier';
                    return (
                      <tr
                        key={`${type}-${item.id}`}
                        onClick={() => handleRowClick(item)}
                        style={{
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        title="Click to Record Stock-In for this product"
                      >
                        <td style={{ fontWeight: 700, color: 'var(--rf-primary)' }}>{code}</td>
                        <td><b>{name}</b></td>
                        <td>
                          <span className="badge b-info">{type}</span>
                        </td>
                        <td className="sub" style={{ fontSize: 12.5 }}>{supplier}</td>
                        <td className="num" style={{ fontWeight: 600 }}>
                          {Number(item.selling_price).toLocaleString()}
                        </td>
                        <td className="num sub">{item.low_stock_threshold}</td>
                        <td className="num" style={{ fontWeight: 700, fontSize: 14 }}>
                          {item.stock_quantity}
                        </td>
                        <td>
                          <StatusBadge
                            status={item.stock_quantity === 0 ? 'CRITICAL' : item.stock_quantity <= item.low_stock_threshold ? 'WARNING' : 'ACTIVE'}
                            label={item.stock_quantity === 0 ? 'Out of Stock' : item.stock_quantity <= item.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                          />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn s sm"
                            style={{ padding: '4px 8px', fontSize: 11.5, gap: 4 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(item);
                            }}
                          >
                            <Plus size={12} /> Stock-In
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeView === 'movements' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="ch" style={{ padding: '18px 20px 10px', margin: 0 }}>
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>Stock Movement History</h2>
              <div className="sub">Immutable audit trail of sales deductions, stock replenishment, and returns</div>
            </div>
            <div className="r sub" style={{ fontSize: 12.5 }}>
              {filteredMovements.length} movements recorded
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Movement ID</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="num">Quantity</th>
                  <th>Reason / Notes</th>
                  <th>Recorded By</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--rf-text-muted)' }}>
                      No stock movement history recorded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((m) => {
                    const qty = m.quantity ?? Math.abs(m.quantity_change ?? 0);
                    const name = m.item_name || (m.product_type ? `${m.product_type} #${m.product_id}` : 'General Stock Item');
                    const recorder = m.created_by_name || m.recorded_by || 'Staff';
                    const reason = m.reason || m.notes || (m.sale_number ? `Order ${m.sale_number}` : 'Inventory Movement');
                    return (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 700, color: 'var(--rf-primary)' }}>#{m.id}</td>
                        <td><b>{name}</b></td>
                        <td>
                          <span className={`badge ${m.movement_type === 'STOCK_IN' ? 'b-ok' : 'b-warn'}`}>
                            {m.movement_type}
                          </span>
                        </td>
                        <td className="num" style={{ fontWeight: 700, color: m.movement_type === 'STOCK_IN' ? 'var(--rf-badge-ok-text)' : 'inherit' }}>
                          {m.movement_type === 'STOCK_IN' ? `+${qty}` : `-${qty}`}
                        </td>
                        <td className="sub">{reason}</td>
                        <td>{recorder}</td>
                        <td className="sub" style={{ fontSize: 12 }}>
                          {new Date(m.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Movement History Pagination Controls */}
          {filteredMovements.length > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                background: 'rgba(248, 250, 252, 0.5)',
              }}
            >
              <span className="sub" style={{ fontSize: 12.5 }}>
                Showing {(movementsPage - 1) * MOVEMENTS_PER_PAGE + 1}–{Math.min(movementsPage * MOVEMENTS_PER_PAGE, filteredMovements.length)} of {filteredMovements.length} movements
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn s sm"
                  disabled={movementsPage === 1}
                  onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '5px 12px', fontSize: 12 }}
                >
                  Previous
                </button>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rf-text-muted)' }}>
                  Page {movementsPage} of {totalMovementPages}
                </span>
                <button
                  type="button"
                  className="btn s sm"
                  disabled={movementsPage >= totalMovementPages}
                  onClick={() => setMovementsPage((p) => Math.min(totalMovementPages, p + 1))}
                  style={{ padding: '5px 12px', fontSize: 12 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* PER-PRODUCT GOODS RECEIPT & PROCUREMENT LEDGER */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Procurement Financial KPI Highlights */}
          <div className="row" style={{ gap: 14 }}>
            <div className="card kpi" style={{ flex: 1, padding: '16px 20px', borderLeft: '4px solid #0D9488' }}>
              <div className="l">
                <Receipt size={16} color="#0D9488" />
                <span>Total Procurement Spend</span>
              </div>
              <div className="v" style={{ color: '#0D9488', fontSize: 24 }}>
                {isAdmin
                  ? `LKR ${goodsReceiptSummary.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Confidential (Admin)'}
              </div>
              <div className="sub">
                {isAdmin ? 'Recorded supplier replenishment wholesale investment' : 'Wholesale expenditure restricted'}
              </div>
            </div>

            <div className="card kpi" style={{ flex: 1, padding: '16px 20px', borderLeft: '4px solid #2563EB' }}>
              <div className="l">
                <Package size={16} color="#2563EB" />
                <span>Total Units Received</span>
              </div>
              <div className="v" style={{ fontSize: 24 }}>
                {goodsReceiptSummary.totalUnits} items
              </div>
              <div className="sub">Physical optical goods checked into live inventory</div>
            </div>

            <div className="card kpi" style={{ flex: 1, padding: '16px 20px', borderLeft: '4px solid #D97706' }}>
              <div className="l">
                <FileText size={16} color="#D97706" />
                <span>Supplier Delivery Bills</span>
              </div>
              <div className="v" style={{ fontSize: 24 }}>
                {goodsReceiptSummary.totalShipments} invoices
              </div>
              <div className="sub">Supplier shipments verified & reconciled</div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="ch" style={{ padding: '18px 20px 10px', margin: 0 }}>
              <div>
                <h2 style={{ fontSize: 18, margin: 0 }}>Goods Receipt & Procurement Ledger</h2>
                <div className="sub">
                  Unique catalog products and their lifetime procurement summary. Click any item to inspect its complete initial intake date, restock batches, and supplier delivery bills.
                </div>
              </div>
              <div className="r sub" style={{ fontSize: 12.5 }}>
                {filteredItems.length} products in catalogue
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Classification</th>
                    <th>Primary Supplier</th>
                    <th className="num">Current Stock</th>
                    <th className="num">Lifetime Restocked</th>
                    <th className="num">Restock Batches</th>
                    <th>Last Restocked</th>
                    {isAdmin && <th className="num">Procurement Capital (LKR)</th>}
                    <th style={{ textAlign: 'center' }}>Lifecycle History</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProductReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 9 : 8} style={{ textAlign: 'center', padding: 36, color: 'var(--rf-text-muted)' }}>
                        No products match your search or classification filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedProductReceipts.map((item) => {
                      const pType = (item.item_type || item.product_type || 'FRAME').toUpperCase();
                      const itemReceipts = goodsReceipts.filter(
                        (r) => r.product_type === pType && Number(r.product_id) === Number(item.id)
                      );
                      const totalRestocked = itemReceipts.reduce((sum, r) => sum + Number(r.quantity_received || 0), 0);
                      const totalSpendOnItem = itemReceipts.reduce((sum, r) => sum + Number(r.total_cost || 0), 0);
                      const latestReceipt = itemReceipts[0];
                      const lastRestockDate = latestReceipt
                        ? new Date(latestReceipt.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Initial Intake';

                      return (
                        <tr
                          key={`${pType}-${item.id}`}
                          onClick={() => handleOpenProductHistory(item)}
                          style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                        >
                          <td>
                            <b style={{ color: 'var(--text-ink, #0F172A)' }}>{item.item_name || item.name}</b>
                            <div className="sub" style={{ fontSize: 11 }}>{item.item_code || item.code}</div>
                          </td>
                          <td>
                            <span className="badge b-info">{pType}</span>
                          </td>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Building size={13} color="var(--text-sub, #64748B)" />
                              <span>{item.supplier_name || 'Direct Optical Vendor'}</span>
                            </span>
                          </td>
                          <td className="num">
                            <StatusBadge
                              variant={
                                item.status === 'IN_STOCK' ? 'ok' : item.status === 'LOW_STOCK' ? 'warn' : 'bad'
                              }
                              label={`${item.stock_quantity}`}
                            />
                          </td>
                          <td className="num" style={{ fontWeight: 700, color: totalRestocked > 0 ? '#059669' : '#64748B' }}>
                            {totalRestocked > 0 ? `+${totalRestocked} units` : 'Initial Only'}
                          </td>
                          <td className="num" style={{ fontWeight: 600 }}>
                            {itemReceipts.length > 0 ? `${itemReceipts.length} batch(es)` : '0 batches'}
                          </td>
                          <td className="sub" style={{ fontSize: 12 }}>
                            {lastRestockDate}
                            {latestReceipt && latestReceipt.invoice_ref && (
                              <div style={{ fontSize: 10, color: '#0284C7', fontWeight: 600 }}>
                                {latestReceipt.invoice_ref}
                              </div>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="num" style={{ fontWeight: 800, color: '#1E293B' }}>
                              {totalSpendOnItem > 0 ? totalSpendOnItem.toLocaleString() : '—'}
                            </td>
                          )}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn s sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProductHistory(item);
                              }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', fontSize: 12 }}
                            >
                              <History size={13} /> View History
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredItems.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'rgba(248, 250, 252, 0.5)',
                }}
              >
                <span className="sub" style={{ fontSize: 12.5 }}>
                  Showing {(receiptsPage - 1) * RECEIPTS_PER_PAGE + 1}–{Math.min(receiptsPage * RECEIPTS_PER_PAGE, filteredItems.length)} of {filteredItems.length} products
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="btn s sm"
                    disabled={receiptsPage === 1}
                    onClick={() => setReceiptsPage((p) => Math.max(1, p - 1))}
                    style={{ padding: '5px 12px', fontSize: 12 }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--rf-text-muted)' }}>
                    Page {receiptsPage} of {totalReceiptPages}
                  </span>
                  <button
                    type="button"
                    className="btn s sm"
                    disabled={receiptsPage >= totalReceiptPages}
                    onClick={() => setReceiptsPage((p) => Math.min(totalReceiptPages, p + 1))}
                    style={{ padding: '5px 12px', fontSize: 12 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock-In Modal */}
      <StockInModal
        isOpen={showStockIn}
        initialProduct={selectedProductForStockIn}
        onClose={() => {
          setShowStockIn(false);
          setSelectedProductForStockIn(null);
        }}
        onSuccess={() => {
          fetchInventory();
        }}
      />

      {/* Product Restock Lifecycle Drill-Down Modal */}
      <ProductRestockHistoryModal
        isOpen={showProductHistory}
        onClose={() => {
          setShowProductHistory(false);
          setSelectedProductForHistory(null);
        }}
        item={selectedProductForHistory}
        receipts={goodsReceipts}
        isAdmin={isAdmin}
        onRecordStockIn={handleRecordStockInFromHistory}
      />
    </div>
  );
};
