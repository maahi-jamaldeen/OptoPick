import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface OrganizedSelectOption {
  value: number | string;
  label: string;
  code?: string;
  subtitle?: string;
  price?: number | string;
  stockStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | null;
  stockCount?: number;
  stockLabel?: string;
  isNoneOption?: boolean;
}

interface OrganizedSelectProps {
  value: number | string;
  onChange: (value: number | string) => void;
  options: OrganizedSelectOption[];
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

export const OrganizedSelect: React.FC<OrganizedSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  leadingIcon,
  disabled = false,
  required = false,
  id,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Clear, crisp optical light palette
  const palette = {
    // Trigger box
    triggerBg: disabled ? '#f8fafc' : '#ffffff',
    triggerBorder: isOpen
      ? '#0284c7'
      : isHovered
      ? '#94a3b8'
      : '#cbd5e1',
    triggerShadow: isOpen
      ? '0 0 0 3px rgba(2, 132, 199, 0.12)'
      : '0 1px 2px rgba(0, 0, 0, 0.02)',

    // Trigger typography & icons
    triggerPlaceholder: '#64748b',
    triggerIcon: '#64748b',
    triggerIconActive: '#0f172a',
    triggerCode: '#475569',
    triggerLabel: '#0f172a',
    triggerLabelNone: '#64748b',
    triggerPrice: '#0f172a',
    triggerChevron: '#64748b',

    // Floating dropdown menu
    menuBg: '#ffffff',
    menuBorder: '#cbd5e1',
    menuShadow: '0 14px 30px -4px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.05)',
    menuDivider: 'rgba(0, 0, 0, 0.05)',
    emptyText: '#64748b',

    // Rows
    rowHoverBg: '#f8fafc',
    rowSelectedBg: 'rgba(2, 132, 199, 0.06)',
    accentBorder: '#0284c7',

    // Row typography
    codeText: '#475569',
    titleText: '#0f172a',
    titleTextSelected: '#0f172a',
    priceText: '#0f172a',
    subtitleText: '#64748b',

    // Stock & status text
    statusLowStock: '#d97706',
    statusOutOfStock: '#dc2626',
    statusInStock: '#64748b',
    statusReady: '#059669',

    // Custom scrollbar
    scrollbarThumb: '#cbd5e1',
    scrollbarThumbHover: '#94a3b8',
  };

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Set initial highlighted index when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => String(opt.value) === String(value));
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].value);
      }
    }
  };

  const handleSelect = (val: number | string) => {
    onChange(val);
    setIsOpen(false);
  };

  // Helper to determine stock status color
  const getStockColor = (opt: OrganizedSelectOption) => {
    if (opt.stockStatus === 'OUT_OF_STOCK') return palette.statusOutOfStock;
    if (opt.stockStatus === 'LOW_STOCK') return palette.statusLowStock;
    if (opt.stockLabel && opt.stockLabel.toLowerCase().includes('ready')) return palette.statusReady;
    return palette.statusInStock;
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', userSelect: 'none' }}
      className={`organized-select-wrapper ${className}`}
      onKeyDown={handleKeyDown}
    >
      <style>{`
        .opt-select-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .opt-select-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .opt-select-scroll::-webkit-scrollbar-thumb {
          background: ${palette.scrollbarThumb};
          border-radius: 4px;
        }
        .opt-select-scroll::-webkit-scrollbar-thumb:hover {
          background: ${palette.scrollbarThumbHover};
        }
      `}</style>

      {/* Hidden native select for form validation */}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* High-Visibility Trigger Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 44,
          padding: '0 14px',
          background: palette.triggerBg,
          border: `1.5px solid ${palette.triggerBorder}`,
          borderRadius: 10,
          boxShadow: palette.triggerShadow,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease',
          opacity: disabled ? 0.6 : 1,
          gap: 12,
        }}
      >
        {/* Leading Content & Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {leadingIcon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: selectedOption && !selectedOption.isNoneOption ? palette.triggerIconActive : palette.triggerIcon,
                flexShrink: 0,
                opacity: 0.9,
              }}
            >
              {leadingIcon}
            </span>
          )}

          {selectedOption ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
              {selectedOption.code && (
                <span
                  style={{
                    fontSize: 11.5,
                    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
                    fontWeight: 700,
                    color: palette.triggerCode,
                    flexShrink: 0,
                    letterSpacing: '0.02em',
                  }}
                >
                  {selectedOption.code}
                </span>
              )}
              {selectedOption.code && <span style={{ color: palette.subtitleText, fontSize: 11, opacity: 0.6 }}>·</span>}
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: selectedOption.isNoneOption ? 500 : 600,
                  color: selectedOption.isNoneOption ? palette.triggerLabelNone : palette.triggerLabel,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {selectedOption.label}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 13.5, color: palette.triggerPlaceholder, whiteSpace: 'nowrap' }}>
              {placeholder}
            </span>
          )}
        </div>

        {/* Right Action: Price tag if present, Clear button & Chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {selectedOption?.price !== undefined && selectedOption?.price !== null && selectedOption?.price !== '' && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: palette.triggerPrice,
                fontFeatureSettings: '"tnum"',
              }}
            >
              LKR {parseFloat(selectedOption.price as any).toLocaleString('en-US')}
            </span>
          )}

          {selectedOption && !disabled && !required && (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Clear selection"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: palette.triggerChevron,
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = palette.triggerChevron;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={13} />
            </button>
          )}

          <ChevronDown
            size={15}
            style={{
              color: palette.triggerChevron,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Floating High-Contrast Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: palette.menuBg,
            border: `1.5px solid ${palette.menuBorder}`,
            borderRadius: 10,
            boxShadow: palette.menuShadow,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Options Scroll List */}
          <div
            ref={listRef}
            className="opt-select-scroll"
            style={{
              maxHeight: 290,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              padding: '4px 0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {options.length === 0 ? (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: palette.emptyText,
                  fontSize: 13,
                }}
              >
                No items available in catalog
              </div>
            ) : (
              options.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = index === highlightedIndex;

                // Option: "None" / default reset option
                if (opt.isNoneOption) {
                  return (
                    <div
                      key={String(opt.value)}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isSelected
                          ? palette.rowSelectedBg
                          : isHighlighted
                          ? palette.rowHoverBg
                          : 'transparent',
                        borderLeft: isSelected ? `3px solid ${palette.accentBorder}` : '3px solid transparent',
                        borderBottom: `1px solid ${palette.menuDivider}`,
                        transition: 'background 0.12s ease',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? '#0284c7' : palette.triggerLabelNone,
                          }}
                        >
                          {opt.label}
                        </div>
                        {opt.subtitle && (
                          <div style={{ fontSize: 11.5, color: palette.subtitleText, marginTop: 2 }}>
                            {opt.subtitle}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check size={16} style={{ color: '#0284c7', flexShrink: 0 }} />}
                    </div>
                  );
                }

                // Standard Catalog Option (Frames, Lenses, Accessories, Patients)
                const stockColor = getStockColor(opt);

                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      background: isSelected
                        ? palette.rowSelectedBg
                        : isHighlighted
                        ? palette.rowHoverBg
                        : 'transparent',
                      borderLeft: isSelected ? `3px solid ${palette.accentBorder}` : '3px solid transparent',
                      borderBottom: `1px solid ${palette.menuDivider}`,
                      transition: 'background 0.12s ease',
                    }}
                  >
                    {/* Row 1: Code + Title on Left; Price + Checkmark on Right */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                        {opt.code && (
                          <span
                            style={{
                              fontSize: 11.5,
                              fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
                              fontWeight: 700,
                              color: palette.codeText,
                              flexShrink: 0,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {opt.code}
                          </span>
                        )}
                        {opt.code && <span style={{ color: palette.subtitleText, fontSize: 11, opacity: 0.6 }}>·</span>}
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? palette.titleTextSelected : palette.titleText,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {opt.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {opt.price !== undefined && opt.price !== null && (
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: palette.priceText,
                              fontFeatureSettings: '"tnum"',
                            }}
                          >
                            LKR {parseFloat(opt.price as any).toLocaleString('en-US')}
                          </span>
                        )}
                        {isSelected && <Check size={16} style={{ color: '#0284c7', flexShrink: 0 }} />}
                      </div>
                    </div>

                    {/* Row 2: Specs on Left; Status / Specs on Right */}
                    {(opt.subtitle || opt.stockLabel) && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        {opt.subtitle ? (
                          <span
                            style={{
                              fontSize: 11.5,
                              color: palette.subtitleText,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {opt.subtitle}
                          </span>
                        ) : <span />}

                        {opt.stockLabel && (
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: stockColor,
                              flexShrink: 0,
                            }}
                          >
                            {opt.stockLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
