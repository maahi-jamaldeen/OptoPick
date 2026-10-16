import React from 'react';

export interface JourneyStep {
  id?: string;
  value: number | string;
  label: string;
  sub: string;
  variant?: 'normal' | 'ai' | 'hot';
  onClick?: () => void;
}

interface JourneyBarProps {
  steps: JourneyStep[];
  title?: string;
  subtitle?: string;
}

export const JourneyBar: React.FC<JourneyBarProps> = ({ steps, title, subtitle }) => {
  return (
    <div className="card" style={{ padding: '20px 24px 18px' }}>
      {(title || subtitle) && (
        <div className="ch">
          {title && <h2>{title}</h2>}
          {subtitle && <span className="r sub">{subtitle}</span>}
        </div>
      )}
      <div className="jr">
        {steps.map((step, idx) => {
          const variantClass = step.variant === 'ai' ? 'ai' : step.variant === 'hot' ? 'hot' : '';
          return (
            <div
              key={idx}
              className={`js ${variantClass}`}
              onClick={step.onClick}
              style={{ cursor: step.onClick ? 'pointer' : 'default' }}
            >
              <div className="jl">{step.value}</div>
              <b style={{ color: 'var(--text-ink)' }}>{step.label}</b>
              <span style={{ color: 'var(--text-sub)' }}>{step.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
