import React from 'react';
import { LayoutDashboard, Stethoscope, ShoppingBag, Sparkles, ShieldCheck, LogOut, Users, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type RailCategory = 'overview' | 'clinical' | 'store' | 'decision' | 'admin';

interface RailProps {
  activeCategory: RailCategory;
  onSelectCategory: (cat: RailCategory) => void;
  onLogoClick: () => void;
}

export const Rail: React.FC<RailProps> = ({
  activeCategory,
  onSelectCategory,
  onLogoClick,
}) => {
  const { user, logout, isAdmin } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return 'OP';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const initials = user ? getInitials(user.full_name || user.fullName || 'Mr. Musthaq') : 'MM';

  return (
    <nav className="rail" aria-label="Primary Category Rail">
      {/* Brand Aperture Mark */}
      <div className="mark" onClick={onLogoClick} title="OptoPick • Indian Optician, Nintavur">
        <i />
      </div>

      {/* 1. Overview */}
      <button
        type="button"
        className={`ri ${activeCategory === 'overview' ? 'on' : ''}`}
        onClick={() => onSelectCategory('overview')}
        title="Overview & Practice Dashboard"
        aria-label="Overview"
      >
        <LayoutDashboard size={22} />
      </button>

      {/* 2. Clinical */}
      <button
        type="button"
        className={`ri ${activeCategory === 'clinical' ? 'on' : ''}`}
        onClick={() => onSelectCategory('clinical')}
        title="Clinical Services (Patients & Refraction)"
        aria-label="Clinical Services"
      >
        <Stethoscope size={22} />
      </button>

      {/* 3. Store */}
      <button
        type="button"
        className={`ri ${activeCategory === 'store' ? 'on' : ''}`}
        onClick={() => onSelectCategory('store')}
        title="Optical Store & Dispensing"
        aria-label="Store"
      >
        <ShoppingBag size={22} />
      </button>

      {/* 4. Decision Support */}
      <button
        type="button"
        className={`ri ${activeCategory === 'decision' ? 'on' : ''}`}
        onClick={() => onSelectCategory('decision')}
        title="AI Decision Support (LensIQ, Forecast, Recall)"
        aria-label="AI Decision Support"
      >
        <Sparkles size={22} />
      </button>

      {/* 5. Administration / Communication */}
      <button
        type="button"
        className={`ri ${activeCategory === 'admin' ? 'on' : ''}`}
        onClick={() => onSelectCategory('admin')}
        title={isAdmin ? 'Practice Administration' : 'Customer Communications'}
        aria-label={isAdmin ? 'Administration' : 'Communication'}
      >
        {isAdmin ? <ShieldCheck size={22} /> : <MessageSquare size={22} />}
      </button>

      {/* Flexible Spacer */}
      <div className="rsp" />

      {/* Sign Out Button */}
      <button
        type="button"
        className="ri"
        onClick={() => logout()}
        title="Sign Out of OptoPick"
        style={{ color: '#FF8F82', marginBottom: 4 }}
      >
        <LogOut size={19} />
      </button>

      {/* User Avatar with Status Indicator */}
      <div
        className="rav"
        title={`${user?.full_name || user?.fullName || 'User'} (${user?.role === 'ADMIN' ? 'Optometrist' : 'Optical Staff'})`}
      >
        {initials}
        <span className="status-dot" title="Online" />
      </div>
    </nav>
  );
};
