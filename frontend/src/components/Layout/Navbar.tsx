import React, { useState } from 'react';
import { Search, Sun, Moon, Plus, ShoppingCart, UserPlus, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BlobButton } from '../Common/BlobButton';

interface NavbarProps {
  title: string;
  subtitle?: string;
  onNavigate?: (page: string) => void;
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  subtitle,
  onNavigate,
  onSearch,
}) => {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchVal, setSearchVal] = useState('');

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const handlePrimaryAction = () => {
    if (!onNavigate) return;
    if (isAdmin) {
      onNavigate('new-exam');
    } else {
      onNavigate('new-sale');
    }
  };

  return (
    <header className="top">
      <div className="top-title-block">
        <h1 className="top-title">{title || (isAdmin ? `Good morning, ${user?.full_name || 'Mr. Musthaq'}` : 'Front Desk Dispatch')}</h1>
        <div className="crumb">{subtitle || `${todayStr} · Indian Optician, Nintavur`}</div>
      </div>

      {/* Global Search Bar */}
      <div className="srch">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search customers, invoices…"
          value={searchVal}
          onChange={handleSearchChange}
          aria-label="Global search"
        />
      </div>

      {/* Refraction Theme Switcher Pill */}
      <div
        className="thm"
        onClick={toggleTheme}
        title={`Current theme: ${theme}. Click to switch to ${theme === 'light' ? 'Dark Mode (Examination Room)' : 'Light Mode (Front Desk)'}`}
        role="button"
        tabIndex={0}
      >
        <span className={theme === 'light' ? 'on' : ''}>
          <Sun size={17} />
        </span>
        <span className={theme === 'dark' ? 'on' : ''}>
          <Moon size={17} />
        </span>
      </div>

      {/* Primary Action Button */}
      {onNavigate && (
        <BlobButton
          type="button"
          size="md"
          onClick={handlePrimaryAction}
        >
          {isAdmin ? (
            <>
              <Stethoscope size={18} />
              <span>Start eye examination</span>
            </>
          ) : (
            <>
              <ShoppingCart size={18} />
              <span>New dispensing sale</span>
            </>
          )}
        </BlobButton>
      )}
    </header>
  );
};
