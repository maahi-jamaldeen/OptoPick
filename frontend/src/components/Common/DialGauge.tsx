import React from 'react';

interface DialGaugeProps {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const DialGauge: React.FC<DialGaugeProps> = ({
  value,
  max,
  label,
  sublabel,
  size = 92,
  strokeWidth = 9,
  color,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(Math.max(value, 0), max);
  const fillPercentage = max > 0 ? clampedValue / max : 0;
  const strokeDashoffset = circumference * (1 - fillPercentage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--dial-track)"
            strokeWidth={strokeWidth}
          />
          {/* Active Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color || 'var(--dial-primary)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div
          className="big"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size > 80 ? 22 : 18,
            color: 'var(--text-ink)',
          }}
        >
          {value}
        </div>
      </div>
      <b style={{ fontSize: 13.5, color: 'var(--text-ink)' }}>{label}</b>
      <span className="sub" style={{ fontSize: 12 }}>{sublabel}</span>
    </div>
  );
};
