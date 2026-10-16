import React from 'react';

interface OptoPickApertureLoaderProps {
  size?: number;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const OptoPickApertureLoader: React.FC<OptoPickApertureLoaderProps> = ({
  size = 76,
  loading = true,
  className = '',
  style,
}) => {
  // SVG Geometry:
  // ViewBox: 0 0 100 100
  // Center: (50, 50)
  // Outer radius: 46, Inner dark core: 23
  // Stroke center radius: r = (46 + 23) / 2 = 34.5, stroke-width = 23
  // Circumference: 2 * Math.PI * 34.5 = 216.77
  const circumference = 216.77;

  return (
    <div
      className={`optopick-aperture-loader-container ${className}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
      role="status"
      aria-label={loading ? 'Processing recommendation...' : 'OptoPick Logo'}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Authentic OptoPick Brand Gradient: Blue -> Violet -> Magenta */}
          <linearGradient id="optopickApertureGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E9AA8" />
            <stop offset="35%" stopColor="#2563EB" />
            <stop offset="70%" stopColor="#6C5CE7" />
            <stop offset="100%" stopColor="#C2408E" />
          </linearGradient>

          {/* Soft outer glow */}
          <filter id="apertureGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#6C5CE7" floodOpacity="0.32" />
          </filter>
        </defs>

        {/* Ambient subtle background track */}
        <circle
          cx="50"
          cy="50"
          r="34.5"
          fill="none"
          stroke="rgba(108, 92, 231, 0.08)"
          strokeWidth="23"
        />

        {/* Dynamic Colored Gradient Ring (Clockwise Emptying & Clockwise Filling) */}
        <circle
          cx="50"
          cy="50"
          r="34.5"
          fill="none"
          stroke="url(#optopickApertureGrad)"
          strokeWidth="23"
          strokeLinecap="round"
          filter="url(#apertureGlow)"
          transform="rotate(-90 50 50)"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: loading ? undefined : 0,
            animation: loading
              ? 'optopickClockwiseEmptyFill 2.6s cubic-bezier(0.45, 0.05, 0.25, 0.95) infinite'
              : 'optopickRestoreComplete 0.4s ease-out forwards',
            transition: 'stroke-dashoffset 0.4s ease-out',
          }}
        />

        {/* Central Dark Pupil Disc (Exact OptoPick Navy Rail Center) */}
        <circle
          cx="50"
          cy="50"
          r="23"
          fill="var(--rail-bg, #14213D)"
          style={{
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
          }}
        />
      </svg>

      <style>{`
        @keyframes optopickClockwiseEmptyFill {
          0% {
            stroke-dashoffset: 0;
          }
          48% {
            stroke-dashoffset: 202;
          }
          52% {
            stroke-dashoffset: 202;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes optopickRestoreComplete {
          from {
            stroke-dashoffset: 202;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .optopick-aperture-loader-container circle {
            animation: none !important;
            stroke-dashoffset: 0 !important;
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
};
