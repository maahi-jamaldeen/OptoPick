import React from 'react';
import { InventoryItem, GoodsReceipt } from '../types';
import { StatusBadge } from '../components/Common/StatusBadge';
import {
  X,
  Package,
  Calendar,
  Receipt,
  Plus,
  Building,
  Clock,
  TrendingUp,
  FileText,
  UserCheck,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface ProductRestockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
  receipts: GoodsReceipt[];
  isAdmin: boolean;
  onRecordStockIn: (item: InventoryItem) => void;
}

export const ProductRestockHistoryModal: React.FC<ProductRestockHistoryModalProps> = ({
  isOpen,
  onClose,
  item,
  receipts,
  isAdmin,
  onRecordStockIn,
}) => {
  if (!isOpen || !item) return null;

  // Filter receipts for this specific product
  const itemReceipts = receipts.filter(
    (r) =>
      r.product_type === (item.item_type || item.product_type) &&
      Number(r.product_id) === Number(item.id)
  );

  // Compute lifetime metrics
  const totalRestockedUnits = itemReceipts.reduce(
    (sum, r) => sum + Number(r.quantity_received || 0),
    0
  );

  const totalProcurementSpend = itemReceipts.reduce(
    (sum, r) => sum + Number(r.total_cost || 0),
    0
  );

  const avgUnitCost =
    totalRestockedUnits > 0 && totalProcurementSpend > 0
      ? totalProcurementSpend / totalRestockedUnits
      : 0;

  const retailPrice = Number(item.selling_price || 0);
  const avgMarginPct =
    retailPrice > 0 && avgUnitCost > 0
      ? Math.round(((retailPrice - avgUnitCost) / retailPrice) * 100)
      : 0;

  const initialIntakeDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : itemReceipts.length > 0
    ? new Date(itemReceipts[itemReceipts.length - 1].created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Catalogue Initial Intake';

  const productType = (item.item_type || item.product_type || 'FRAME').toUpperCase();
  const productName = item.item_name || item.name || '';
  const productCode = item.item_code || item.code || '';
  const supplierName = item.supplier_name || 'Direct Optical Vendor';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle, #E2E8F0)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
          }}
        >
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <span className="badge b-info" style={{ fontSize: 11, fontWeight: 700 }}>
                {productType}
              </span>
              <span className="badge" style={{ fontSize: 11, background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
                SKU: {productCode}
              </span>
              <StatusBadge
                variant={
                  item.status === 'IN_STOCK' ? 'ok' : item.status === 'LOW_STOCK' ? 'warn' : 'bad'
                }
                label={
                  item.status === 'IN_STOCK'
                    ? `In Stock (${item.stock_quantity})`
                    : item.status === 'LOW_STOCK'
                    ? `Low Stock (${item.stock_quantity})`
                    : 'Out of Stock'
                }
              />
            </div>

            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 800, color: 'var(--text-ink, #0F172A)' }}>
              {productName}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 8, fontSize: 13, color: 'var(--text-sub, #64748B)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building size={14} color="#0D9488" />
                <b>Primary Vendor:</b> {supplierName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={14} color="#2563EB" />
                <b>Retail Price:</b> LKR {retailPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn p sm"
              onClick={() => {
                onClose();
                onRecordStockIn(item);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> Record Stock-In
            </button>
            <button
              type="button"
              className="btn s sm"
              onClick={onClose}
              style={{ padding: 8, borderRadius: 8, color: '#64748B' }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 4 Metric Summary Cards */}
          <div className="row" style={{ gap: 14 }}>
            {/* Card 1: Initial Intake Date */}
            <div
              className="card kpi"
              style={{
                flex: 1,
                padding: '16px 18px',
                borderLeft: '4px solid #0284C7',
                background: '#F0F9FF',
              }}
            >
              <div className="l" style={{ color: '#0369A1' }}>
                <Calendar size={15} />
                <span>First Acquired</span>
              </div>
              <div className="v" style={{ fontSize: 18, fontWeight: 800, color: '#0369A1', marginTop: 4 }}>
                {initialIntakeDate}
              </div>
              <div className="sub" style={{ fontSize: 12 }}>Initial catalogue registration</div>
            </div>

            {/* Card 2: Lifetime Units Received */}
            <div
              className="card kpi"
              style={{
                flex: 1,
                padding: '16px 18px',
                borderLeft: '4px solid #059669',
                background: '#ECFDF5',
              }}
            >
              <div className="l" style={{ color: '#047857' }}>
                <Package size={15} />
                <span>Restocked Units</span>
              </div>
              <div className="v" style={{ fontSize: 18, fontWeight: 800, color: '#047857', marginTop: 4 }}>
                +{totalRestockedUnits} units
              </div>
              <div className="sub" style={{ fontSize: 12 }}>Across {itemReceipts.length} replenishment batches</div>
            </div>

            {/* Card 3: Total Procurement Spend */}
            <div
              className="card kpi"
              style={{
                flex: 1,
                padding: '16px 18px',
                borderLeft: '4px solid #7C3AED',
                background: '#F5F3FF',
              }}
            >
              <div className="l" style={{ color: '#6D28D9' }}>
                <Receipt size={15} />
                <span>Procurement Spend</span>
              </div>
              <div className="v" style={{ fontSize: 18, fontWeight: 800, color: '#6D28D9', marginTop: 4 }}>
                {isAdmin
                  ? `LKR ${totalProcurementSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Confidential'}
              </div>
              <div className="sub" style={{ fontSize: 12 }}>
                {isAdmin ? 'Total wholesale capital invested' : 'Restricted to management'}
              </div>
            </div>

            {/* Card 4: Avg Unit Cost & Gross Margin */}
            <div
              className="card kpi"
              style={{
                flex: 1,
                padding: '16px 18px',
                borderLeft: '4px solid #D97706',
                background: '#FFFBEB',
              }}
            >
              <div className="l" style={{ color: '#B45309' }}>
                <Layers size={15} />
                <span>Avg Cost &amp; Margin</span>
              </div>
              <div className="v" style={{ fontSize: 18, fontWeight: 800, color: '#B45309', marginTop: 4 }}>
                {isAdmin
                  ? avgUnitCost > 0
                    ? `LKR ${Math.round(avgUnitCost).toLocaleString()} (${avgMarginPct}%)`
                    : 'N/A'
                  : 'Confidential'}
              </div>
              <div className="sub" style={{ fontSize: 12 }}>
                {isAdmin ? `Gross margin against LKR ${retailPrice.toLocaleString()}` : 'Wholesale metrics restricted'}
              </div>
            </div>
          </div>

          {/* Chronological Restock & Intake History Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle, #E2E8F0)' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle, #E2E8F0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC',
              }}
            >
              <div>
                <b style={{ fontSize: 15, color: 'var(--text-ink, #0F172A)' }}>
                  Chronological Goods Receipt &amp; Restock History
                </b>
                <div className="sub" style={{ fontSize: 12.5, marginTop: 2 }}>
                  Every verified replenishment batch, supplier invoice reference, and unit cost at time of intake.
                </div>
              </div>
              <span className="badge" style={{ background: '#E2E8F0', color: '#334155', fontWeight: 700, fontSize: 11 }}>
                {itemReceipts.length} Batches Recorded
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '10px 16px' }}>Date &amp; Time</th>
                    <th style={{ padding: '10px 16px' }}>Supplier / Vendor</th>
                    <th style={{ padding: '10px 16px' }}>Invoice / Bill Ref</th>
                    <th className="num" style={{ padding: '10px 16px' }}>Qty In</th>
                    {isAdmin && <th className="num" style={{ padding: '10px 16px' }}>Unit Cost (LKR)</th>}
                    {isAdmin && <th className="num" style={{ padding: '10px 16px' }}>Total Cost (LKR)</th>}
                    <th className="num" style={{ padding: '10px 16px' }}>Stock Change</th>
                    <th style={{ padding: '10px 16px' }}>Verified By</th>
                    <th style={{ padding: '10px 16px' }}>Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {itemReceipts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 9 : 7}
                        style={{
                          textAlign: 'center',
                          padding: '36px 20px',
                          color: 'var(--text-muted, #94A3B8)',
                        }}
                      >
                        <Clock size={28} style={{ margin: '0 auto 8px', opacity: 0.5, display: 'block' }} />
                        <b style={{ color: '#475569', fontSize: 14, display: 'block' }}>
                          No Replenishment Batches Recorded Yet
                        </b>
                        <p style={{ margin: '4px 0 14px', fontSize: 12.5 }}>
                          This product is currently operating on its initial catalogue intake of {item.stock_quantity} units registered on {initialIntakeDate}.
                        </p>
                        <button
                          type="button"
                          className="btn p sm"
                          onClick={() => {
                            onClose();
                            onRecordStockIn(item);
                          }}
                        >
                          <Plus size={14} /> Record First Restock Batch
                        </button>
                      </td>
                    </tr>
                  ) : (
                    itemReceipts.map((r, index) => {
                      const cost = Number(r.unit_cost || 0);
                      const totalCost = Number(r.total_cost || 0);
                      return (
                        <tr
                          key={r.id || index}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            background: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          }}
                        >
                          <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-ink, #0F172A)' }}>
                              {new Date(r.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="sub" style={{ fontSize: 11 }}>
                              {new Date(r.created_at).toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155' }}>
                            {r.supplier_name || supplierName}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              className="badge"
                              style={{
                                background: '#E0F2FE',
                                color: '#0369A1',
                                border: '1px solid #BAE6FD',
                                fontSize: 11.5,
                                fontWeight: 700,
                              }}
                            >
                              {r.invoice_ref || 'DIRECT_RECEIPT'}
                            </span>
                          </td>
                          <td className="num" style={{ padding: '12px 16px', fontWeight: 800, color: '#059669', fontSize: 14 }}>
                            +{r.quantity_received}
                          </td>
                          {isAdmin && (
                            <td className="num" style={{ padding: '12px 16px', fontWeight: 600 }}>
                              {cost > 0 ? cost.toLocaleString() : '—'}
                            </td>
                          )}
                          {isAdmin && (
                            <td className="num" style={{ padding: '12px 16px', fontWeight: 800, color: '#1E293B' }}>
                              {totalCost > 0 ? totalCost.toLocaleString() : '—'}
                            </td>
                          )}
                          <td className="num" style={{ padding: '12px 16px', color: '#64748B', fontSize: 12.5 }}>
                            {r.previous_quantity} &rarr; <b style={{ color: '#0F172A' }}>{r.new_quantity}</b>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#475569', fontSize: 12.5 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <UserCheck size={13} color="#64748B" />
                              {r.recorded_by || 'Staff'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748B', fontSize: 12, maxWidth: 220 }}>
                            {r.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F8FAFC',
          }}
        >
          <div className="sub" style={{ fontSize: 12.5 }}>
            Product Restock Lifecycle Ledger &bull; OptoPick Inventory Intelligence
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn s" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="btn p"
              onClick={() => {
                onClose();
                onRecordStockIn(item);
              }}
            >
              <Plus size={15} /> Record New Stock-In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
