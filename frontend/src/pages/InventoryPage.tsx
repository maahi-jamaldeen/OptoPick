import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { InventoryItem, InventoryMovement, GoodsReceipt } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import { StockInModal, PreselectedProduct } from './StockInModal';
import { ProductRestockHistoryModal } from './ProductRestockHistoryModal';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Helper for Main Navigation View Tabs (Current Stock Levels, Movement Audit History, Goods Receipt & Procurement Ledger)
  const getMainTabStyle = (isActive: boolean) => {
    if (isActive) {
      return {
        background: isDark ? '#2563EB' : '#123B50',
        color: '#ffffff',
        border: isDark ? '1.5px solid #60A5FA' : '1.5px solid #123B50',
        boxShadow: isDark
          ? '0 0 16px rgba(37, 99, 235, 0.45)'
          : '0 4px 14px rgba(18, 59, 80, 0.22)',
        fontWeight: 700,
      };
    }
    return {
      background: 'transparent',
      color: 'var(--text-sub)',
      border: isDark ? '1.5px solid rgba(255, 255, 255, 0.35)' : '1.5px solid #ffffff',
      fontWeight: 600,
    };
  };

  // Helper for Status Filter Tabs (All Status, Low Stock, Out of Stock)
  const getStatusFilterStyle = (filter: 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK') => {
    const isSelected = statusFilter === filter;
    if (filter === 'ALL') {
      if (isSelected) {
        return {
          background: isDark ? '#334155' : '#123B50',
          color: '#ffffff',
          border: isDark ? '1.5px solid #64748B' : '1.5px solid #123B50',
          boxShadow: isDark ? '0 0 12px rgba(100, 116, 139, 0.35)' : '0 2px 10px rgba(18, 59, 80, 0.2)',
          fontWeight: 700,
        };
      }
      return {
        background: 'transparent',
        color: 'var(--text-sub)',
        border: isDark ? '1.5px solid rgba(255, 255, 255, 0.3)' : '1.5px solid #ffffff',
        fontWeight: 600,
      };
    }

    if (filter === 'LOW_STOCK') {
      if (isSelected) {
        return {
          background: isDark ? '#B45309' : '#D97706',
          color: '#ffffff',
          border: isDark ? '1.5px solid #FBBF24' : '1.5px solid #B45309',
          boxShadow: isDark ? '0 0 16px rgba(251, 191, 36, 0.45)' : '0 3px 12px rgba(217, 119, 6, 0.35)',
          fontWeight: 700,
        };
      }
      return {
        background: 'transparent',
        color: isDark ? '#FBBF24' : '#D97706',
        border: isDark ? '1.5px solid rgba(251, 191, 36, 0.4)' : '1.5px solid #ffffff',
        fontWeight: 600,
      };
    }

    if (filter === 'OUT_OF_STOCK') {
      if (isSelected) {
        return {
          background: isDark ? '#991B1B' : '#DC2626',
          color: '#ffffff',
          border: isDark ? '1.5px solid #F87171' : '1.5px solid #991B1B',
          boxShadow: isDark ? '0 0 16px rgba(248, 113, 113, 0.45)' : '0 3px 12px rgba(220, 38, 38, 0.35)',
          fontWeight: 700,
        };
      }
      return {
        background: 'transparent',
        color: isDark ? '#F87171' : '#DC2626',
        border: isDark ? '1.5px solid rgba(248, 113, 113, 0.4)' : '1.5px solid #ffffff',
        fontWeight: 600,
      };
    }
  };

  // Helper for Classification Filter Buttons (All Types, Frames, Lenses, Accessories)
  const getTypeFilterStyle = (type: 'ALL' | 'FRAME' | 'LENS' | 'ACCESSORY') => {
    const isSelected = typeFilter === type;
    if (isSelected) {
      return {
        background: isDark ? '#2563EB' : '#123B50',
        color: '#ffffff',
        border: isDark ? '1px solid #60A5FA' : '1px solid #123B50',
        fontWeight: 700,
        padding: '4px 12px',
        fontSize: 12,
      };
    }
    return {
      background: 'transparent',
      color: 'var(--text-sub)',
      border: '1px solid transparent',
      fontWeight: 500,
      padding: '4px 12px',
      fontSize: 12,
    };
  };

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
      {/* 3 Percentage Rail KPI Cards (High-Intensity Exact Swatch Palettes) */}
      <div className="row" style={{ gap: 16 }}>
        {/* Card 1: Total Tracked SKUs (Green Swatch: #051F20 -> #DAF1DE) */}
        <div className="op-rail-kpi card-green card-blue">
          <div className="op-rail-left">
            <div>
              <div className="op-rail-header" style={{ color: isDark ? '#DAF1DE' : '#051F20' }}>
                <Package size={18} color={isDark ? '#8EB69B' : '#0B2B26'} strokeWidth={2.2} />
                <span>Total Tracked SKUs</span>
              </div>
              <div className="op-rail-value" style={{ color: isDark ? '#DAF1DE' : '#051F20' }}>{totalCatalogCount}</div>
            </div>
            <div className="op-rail-sub" style={{ color: isDark ? '#8EB69B' : '#0B2B26', fontWeight: 600 }}>Real-time inventory catalogue</div>
            <div className="op-rail-footer" style={{ borderTopColor: isDark ? 'rgba(142, 182, 155, 0.2)' : 'rgba(11, 43, 38, 0.22)', color: isDark ? '#8EB69B' : '#051F20', fontWeight: 600 }}>
              <span className="op-rail-dot" style={{ background: isDark ? '#8EB69B' : '#051F20', boxShadow: isDark ? 'none' : '0 0 0 2px rgba(35, 83, 71, 0.35)' }} />
              <span>All inventory</span>
            </div>
          </div>
          <div className="op-rail-right">
            <span className="op-rail-pct" style={{ color: isDark ? '#DAF1DE' : '#051F20', fontWeight: 900 }}>100%</span>
            <div className="op-rail-bar-track" style={{ background: isDark ? 'rgba(11, 43, 38, 0.8)' : 'rgba(11, 43, 38, 0.2)' }}>
              <div
                className="op-rail-bar-fill"
                style={{
                  height: '100%',
                  background: isDark ? '#8EB69B' : 'linear-gradient(180deg, #235347 0%, #051F20 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Low Stock Warnings (Blue Swatch: #021024 -> #C1E8FF) */}
        <div className="op-rail-kpi card-blue-palette card-amber">
          <div className="op-rail-left">
            <div>
              <div className="op-rail-header" style={{ color: isDark ? '#C1E8FF' : '#021024' }}>
                <AlertTriangle size={18} color={isDark ? '#7DA0CA' : '#052659'} strokeWidth={2.2} />
                <span>Low Stock Warnings</span>
              </div>
              <div className="op-rail-value" style={{ color: isDark ? '#C1E8FF' : '#021024' }}>{lowStockCount}</div>
            </div>
            <div className="op-rail-sub" style={{ color: isDark ? '#7DA0CA' : '#052659', fontWeight: 600 }}>At or below reorder threshold</div>
            <div className="op-rail-footer" style={{ borderTopColor: isDark ? 'rgba(125, 160, 202, 0.2)' : 'rgba(5, 38, 89, 0.22)', color: isDark ? '#7DA0CA' : '#021024', fontWeight: 600 }}>
              <span className="op-rail-dot" style={{ background: isDark ? '#7DA0CA' : '#021024', boxShadow: isDark ? 'none' : '0 0 0 2px rgba(5, 38, 89, 0.35)' }} />
              <span>Reorder soon</span>
            </div>
          </div>
          <div className="op-rail-right">
            <span className="op-rail-pct" style={{ color: isDark ? '#C1E8FF' : '#021024', fontWeight: 900 }}>{lowStockPctStr}</span>
            <div className="op-rail-bar-track" style={{ background: isDark ? 'rgba(5, 38, 89, 0.8)' : 'rgba(5, 38, 89, 0.2)' }}>
              <div
                className="op-rail-bar-fill"
                style={{
                  height: `${Math.min(100, Math.max(12, lowStockPctNum))}%`,
                  background: isDark ? '#7DA0CA' : 'linear-gradient(180deg, #5483B3 0%, #021024 100%)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Out of Stock (Mocha/Espresso Swatch: #291C0E -> #E1D4C2) */}
        <div className="op-rail-kpi card-mocha card-red">
          <div className="op-rail-left">
            <div>
              <div className="op-rail-header" style={{ color: isDark ? '#E1D4C2' : '#291C0E' }}>
                <AlertCircle size={18} color={isDark ? '#BEB5A9' : '#6E473B'} strokeWidth={2.2} />
                <span>Out of Stock</span>
              </div>
              <div className="op-rail-value" style={{ color: isDark ? '#E1D4C2' : '#291C0E' }}>{outOfStockCount}</div>
            </div>
            <div className="op-rail-sub" style={{ color: isDark ? '#BEB5A9' : '#291C0E', fontWeight: 600 }}>Supplier replenishment needed</div>
            <div className="op-rail-footer" style={{ borderTopColor: isDark ? 'rgba(190, 181, 169, 0.2)' : 'rgba(41, 28, 14, 0.22)', color: isDark ? '#BEB5A9' : '#291C0E', fontWeight: 600 }}>
              <span className="op-rail-dot" style={{ background: isDark ? '#BEB5A9' : '#291C0E', boxShadow: isDark ? 'none' : '0 0 0 2px rgba(110, 71, 59, 0.35)' }} />
              <span>Action required</span>
            </div>
          </div>
          <div className="op-rail-right">
            <span className="op-rail-pct" style={{ color: isDark ? '#E1D4C2' : '#291C0E', fontWeight: 900 }}>{outOfStockPctStr}</span>
            <div className="op-rail-bar-track" style={{ background: isDark ? 'rgba(41, 28, 14, 0.8)' : 'rgba(41, 28, 14, 0.2)' }}>
              <div
                className="op-rail-bar-fill"
                style={{
                  height: `${Math.min(100, Math.max(15, outOfStockPctNum))}%`,
                  background: isDark ? '#BEB5A9' : 'linear-gradient(180deg, #6E473B 0%, #291C0E 100%)',
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
            style={getMainTabStyle(activeView === 'levels')}
          >
            Current Stock Levels
          </button>
          <button
            type="button"
            className={`tab ${activeView === 'movements' ? 'on' : ''}`}
            onClick={() => setActiveView('movements')}
            style={getMainTabStyle(activeView === 'movements')}
          >
            Movement Audit History
          </button>
          <button
            type="button"
            className={`tab ${activeView === 'receipts' ? 'on' : ''}`}
            onClick={() => setActiveView('receipts')}
            style={{ ...getMainTabStyle(activeView === 'receipts'), display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Receipt size={14} color={activeView === 'receipts' ? '#ffffff' : (isDark ? '#2dd4bf' : '#0D9488')} />
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
                style={getStatusFilterStyle('ALL')}
              >
                All Status
              </button>
              <button
                type="button"
                className={`tab ${statusFilter === 'LOW_STOCK' ? 'on' : ''}`}
                onClick={() => setStatusFilter('LOW_STOCK')}
                style={getStatusFilterStyle('LOW_STOCK')}
              >
                Low Stock
              </button>
              <button
                type="button"
                className={`tab ${statusFilter === 'OUT_OF_STOCK' ? 'on' : ''}`}
                onClick={() => setStatusFilter('OUT_OF_STOCK')}
                style={getStatusFilterStyle('OUT_OF_STOCK')}
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
          <div className="tabs" style={{ background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(148, 163, 184, 0.12)', padding: 3, borderRadius: 10, border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.04)' }}>
            <button
              type="button"
              className={`tab ${typeFilter === 'ALL' ? 'on' : ''}`}
              onClick={() => setTypeFilter('ALL')}
              style={getTypeFilterStyle('ALL')}
            >
              All Types
            </button>
            <button
              type="button"
              className={`tab ${typeFilter === 'FRAME' ? 'on' : ''}`}
              onClick={() => setTypeFilter('FRAME')}
              style={getTypeFilterStyle('FRAME')}
            >
              Frames
            </button>
            <button
              type="button"
              className={`tab ${typeFilter === 'LENS' ? 'on' : ''}`}
              onClick={() => setTypeFilter('LENS')}
              style={getTypeFilterStyle('LENS')}
            >
              Lenses
            </button>
            <button
              type="button"
              className={`tab ${typeFilter === 'ACCESSORY' ? 'on' : ''}`}
              onClick={() => setTypeFilter('ACCESSORY')}
              style={getTypeFilterStyle('ACCESSORY')}
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
          {/* Procurement Financial KPI Highlights (Elegant Gradients for Light & Dark) */}
          <div className="row" style={{ gap: 14 }}>
            {/* Box 1: Total Procurement Spend */}
            <div
              className="card kpi"
              style={{
                flex: 1,
                padding: '18px 22px',
                borderRadius: 16,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.24) 0%, rgba(15, 30, 36, 0.85) 60%, #16202c 100%)'
                  : 'linear-gradient(135deg, rgba(204, 251, 241, 0.75) 0%, rgba(240, 253, 250, 0.9) 55%, #ffffff 100%)',
                border: isDark ? '1px solid rgba(45, 212, 191, 0.3)' : '1px solid rgba(13, 148, 136, 0.25)',
                borderLeft: isDark ? '4px solid #2dd4bf' : '4px solid #0d9488',
                boxShadow: isDark
                  ? '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(45, 212, 191, 0.08)'
                  : '0 4px 16px rgba(13, 148, 136, 0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div className="l" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, color: isDark ? '#5eead4' : '#0f766e' }}>
                <Receipt size={17} color={isDark ? '#2dd4bf' : '#0d9488'} />
                <span>Total Procurement Spend</span>
              </div>
              <div className="v" style={{ color: isDark ? '#2dd4bf' : '#0f766e', fontSize: 26, fontWeight: 800, margin: '8px 0 4px', fontFeatureSettings: '"tnum"' }}>
                {isAdmin
                  ? `LKR ${goodsReceiptSummary.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Confidential (Admin)'}
              </div>
              <div className="sub" style={{ fontSize: 12.5, color: isDark ? '#a6b3c1' : '#64748b' }}>
                {isAdmin ? 'Recorded supplier replenishment wholesale investment' : 'Wholesale expenditure restricted'}
              </div>
            </div>

            {/* Box 2: Total Units Received */}
            <div
              className="card kpi"
              style={{
                flex: 1,
                padding: '18px 22px',
                borderRadius: 16,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.24) 0%, rgba(20, 28, 48, 0.85) 60%, #16202c 100%)'
                  : 'linear-gradient(135deg, rgba(224, 231, 255, 0.75) 0%, rgba(238, 242, 255, 0.9) 55%, #ffffff 100%)',
                border: isDark ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid rgba(37, 99, 235, 0.25)',
                borderLeft: isDark ? '4px solid #60a5fa' : '4px solid #2563eb',
                boxShadow: isDark
                  ? '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(96, 165, 250, 0.08)'
                  : '0 4px 16px rgba(37, 99, 235, 0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div className="l" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                <Package size={17} color={isDark ? '#60a5fa' : '#2563eb'} />
                <span>Total Units Received</span>
              </div>
              <div className="v" style={{ color: isDark ? '#93c5fd' : '#1e3a8a', fontSize: 26, fontWeight: 800, margin: '8px 0 4px', fontFeatureSettings: '"tnum"' }}>
                {goodsReceiptSummary.totalUnits} items
              </div>
              <div className="sub" style={{ fontSize: 12.5, color: isDark ? '#a6b3c1' : '#64748b' }}>
                Physical optical goods checked into live inventory
              </div>
            </div>

            {/* Box 3: Supplier Delivery Bills */}
            <div
              className="card kpi"
              style={{
                flex: 1,
                padding: '18px 22px',
                borderRadius: 16,
                background: isDark
                  ? 'linear-gradient(135deg, rgba(217, 119, 6, 0.24) 0%, rgba(38, 28, 18, 0.85) 60%, #16202c 100%)'
                  : 'linear-gradient(135deg, rgba(254, 243, 199, 0.75) 0%, rgba(255, 251, 235, 0.9) 55%, #ffffff 100%)',
                border: isDark ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(217, 119, 6, 0.25)',
                borderLeft: isDark ? '4px solid #fbbf24' : '4px solid #d97706',
                boxShadow: isDark
                  ? '0 8px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(251, 191, 36, 0.08)'
                  : '0 4px 16px rgba(217, 119, 6, 0.08)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div className="l" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13.5, color: isDark ? '#fde68a' : '#b45309' }}>
                <FileText size={17} color={isDark ? '#fbbf24' : '#d97706'} />
                <span>Supplier Delivery Bills</span>
              </div>
              <div className="v" style={{ color: isDark ? '#fbbf24' : '#92400e', fontSize: 26, fontWeight: 800, margin: '8px 0 4px', fontFeatureSettings: '"tnum"' }}>
                {goodsReceiptSummary.totalShipments} invoices
              </div>
              <div className="sub" style={{ fontSize: 12.5, color: isDark ? '#a6b3c1' : '#64748b' }}>
                Supplier shipments verified & reconciled
              </div>
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
