import React from 'react';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  Receipt,
  PlusCircle,
  Glasses,
  Package,
  Building2,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Clock,
  Send,
  ShieldCheck,
  BarChart3,
  Sliders,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RailCategory } from './Rail';

interface SidebarProps {
  activeCategory: RailCategory;
  currentPage: string;
  onNavigate: (page: string) => void;
  reviewCounts?: {
    lensIQReviews?: number;
    optoRecall?: number;
    messages?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeCategory,
  currentPage,
  onNavigate,
  reviewCounts = { lensIQReviews: 3, optoRecall: 8, messages: 4 },
}) => {
  const { isAdmin } = useAuth();

  const getCategoryMeta = () => {
    switch (activeCategory) {
      case 'overview':
        return { title: 'Practice Overview', subtitle: 'Daily takings & activity' };
      case 'clinical':
        return { title: 'Clinical Services', subtitle: 'Patients & refractions' };
      case 'store':
        return { title: 'Store & Dispensing', subtitle: 'Sales, stock & catalogue' };
      case 'decision':
        return { title: 'AI Decision Support', subtitle: 'LensIQ & forecasting' };
      case 'admin':
        return { title: isAdmin ? 'Administration' : 'Communications', subtitle: isAdmin ? 'System & practice control' : 'Customer dispatch outbox' };
      default:
        return { title: 'Navigation', subtitle: '' };
    }
  };

  const meta = getCategoryMeta();

  return (
    <aside className="side" aria-label="Contextual Sub-Navigation">
      {/* Brand Header */}
      <div className="brand">
        <b>OptoPick</b>
        <small>Indian Optician, Nintavur</small>
      </div>

      {/* Role Portal Pill */}
      <div className="portal">
        <i />
        <span>{isAdmin ? 'Optometrist portal' : 'Staff portal'}</span>
      </div>

      {/* Active Module Header */}
      <div className="grp">
        <span>{meta.title}</span>
      </div>

      {/* Dynamic Nav Items for Active Category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* 1. OVERVIEW CATEGORY */}
        {activeCategory === 'overview' && (
          <>
            <button
              type="button"
              className={`nav ${currentPage === 'dashboard' ? 'on' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Today's Dashboard</span>
            </button>

            <button
              type="button"
              className={`nav ${currentPage === 'new-sale' ? 'on' : ''}`}
              onClick={() => onNavigate('new-sale')}
            >
              <ShoppingCart size={18} />
              <span>New Dispensing Sale</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                className={`nav ${currentPage === 'new-exam' ? 'on' : ''}`}
                onClick={() => onNavigate('new-exam')}
              >
                <Stethoscope size={18} />
                <span>Record Examination</span>
              </button>
            )}
          </>
        )}

        {/* 2. CLINICAL CATEGORY */}
        {activeCategory === 'clinical' && (
          <>
            <button
              type="button"
              className={`nav ${currentPage === 'customers' ? 'on' : ''}`}
              onClick={() => onNavigate('customers')}
            >
              <Users size={18} />
              <span>Customer Directory</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                className={`nav ${currentPage === 'new-exam' ? 'on' : ''}`}
                onClick={() => onNavigate('new-exam')}
              >
                <Stethoscope size={18} />
                <span>Record Examination</span>
              </button>
            )}

            <button
              type="button"
              className={`nav ${currentPage === 'customer-detail' ? 'on' : ''}`}
              onClick={() => onNavigate('customers')}
            >
              <FileText size={18} />
              <span>Prescription History</span>
            </button>
          </>
        )}

        {/* 3. STORE CATEGORY */}
        {activeCategory === 'store' && (
          <>
            <button
              type="button"
              className={`nav ${currentPage === 'sales' ? 'on' : ''}`}
              onClick={() => onNavigate('sales')}
            >
              <Receipt size={18} />
              <span>Sales & Invoicing</span>
            </button>

            <button
              type="button"
              className={`nav ${currentPage === 'new-sale' ? 'on' : ''}`}
              onClick={() => onNavigate('new-sale')}
            >
              <PlusCircle size={18} />
              <span>New Dispensing POS</span>
            </button>

            <button
              type="button"
              className={`nav ${currentPage === 'products' ? 'on' : ''}`}
              onClick={() => onNavigate('products')}
            >
              <Glasses size={18} />
              <span>Frames & Lenses</span>
            </button>

            <button
              type="button"
              className={`nav ${currentPage === 'inventory' ? 'on' : ''}`}
              onClick={() => onNavigate('inventory')}
            >
              <Package size={18} />
              <span>Stock-In & Ledger</span>
            </button>

            <button
              type="button"
              className={`nav ${currentPage === 'suppliers' ? 'on' : ''}`}
              onClick={() => onNavigate('suppliers')}
            >
              <Building2 size={18} />
              <span>Optical Suppliers</span>
            </button>
          </>
        )}

        {/* 4. DECISION SUPPORT CATEGORY */}
        {activeCategory === 'decision' && (
          <>
            <button
              type="button"
              className={`nav ${currentPage === 'lens-iq' ? 'on' : ''}`}
              onClick={() => onNavigate('lens-iq')}
            >
              <Sparkles size={18} />
              <span>LensIQ Suggestions</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                className={`nav ${currentPage === 'lens-iq-reviews' ? 'on' : ''}`}
                onClick={() => onNavigate('lens-iq-reviews')}
              >
                <CheckCircle2 size={18} />
                <span>LensIQ Reviews</span>
                {reviewCounts.lensIQReviews ? (
                  <span className="tag">{reviewCounts.lensIQReviews}</span>
                ) : null}
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                className={`nav ${currentPage === 'forecast' ? 'on' : ''}`}
                onClick={() => onNavigate('forecast')}
              >
                <TrendingUp size={18} />
                <span>OptoForecast</span>
              </button>
            )}

            <button
              type="button"
              className={`nav ${currentPage === 'recall' ? 'on' : ''}`}
              onClick={() => onNavigate('recall')}
            >
              <Clock size={18} />
              <span>OptoRecall</span>
              {reviewCounts.optoRecall ? (
                <span className="tag">{reviewCounts.optoRecall}</span>
              ) : null}
            </button>
          </>
        )}

        {/* 5. ADMINISTRATION / COMMUNICATION CATEGORY */}
        {activeCategory === 'admin' && (
          <>
            <button
              type="button"
              className={`nav ${currentPage === 'messages' ? 'on' : ''}`}
              onClick={() => onNavigate('messages')}
            >
              <Send size={18} />
              <span>Messages Outbox</span>
              {reviewCounts.messages ? (
                <span className="tag">{reviewCounts.messages}</span>
              ) : null}
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  className={`nav ${currentPage === 'users' ? 'on' : ''}`}
                  onClick={() => onNavigate('users')}
                >
                  <ShieldCheck size={18} />
                  <span>Users & Access</span>
                </button>

                <button
                  type="button"
                  className={`nav ${currentPage === 'reports' ? 'on' : ''}`}
                  onClick={() => onNavigate('reports')}
                >
                  <BarChart3 size={18} />
                  <span>Management Reports</span>
                </button>

                <button
                  type="button"
                  className={`nav ${currentPage === 'settings' ? 'on' : ''}`}
                  onClick={() => onNavigate('settings')}
                >
                  <Sliders size={18} />
                  <span>Practice Settings</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer Info Card */}
      <div
        style={{
          marginTop: 'auto',
          padding: '12px 14px',
          borderRadius: 12,
          background: 'var(--portal-bg)',
          border: '1px solid var(--border-color)',
          fontSize: 11.5,
          color: 'var(--text-sub)',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--text-ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B7F52', display: 'inline-block' }} />
          <span>Indian Optician</span>
        </div>
        <div>No 67/1, Main St, Nintavur</div>
        <div style={{ opacity: 0.8, fontSize: 11 }}>Dispensing Optical Center</div>
      </div>
    </aside>
  );
};
