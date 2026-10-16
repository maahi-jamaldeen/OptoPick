import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * OptoPickAIIcon - The Master Brand Icon for OptoPick AI
 * Depicts an intelligent optical aperture with interconnected neural focal points.
 * Distinct from generic stars/sparkles; specifically tailored to OptoPick.
 */
export const OptoPickAIIcon: React.FC<IconProps> = ({ size = 16, className = '', style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="optoAiGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      {/* Outer Optical Ring */}
      <circle cx="12" cy="12" r="9" stroke="url(#optoAiGrad)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Central Intelligent Focal Core */}
      <circle cx="12" cy="12" r="3" fill="url(#optoAiGrad)" />
      {/* Optical Refraction Axes */}
      <path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke="url(#optoAiGrad)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Dynamic Iris Aperture Blades */}
      <path d="M7.5 7.5L9.5 9.5M14.5 14.5L16.5 16.5M16.5 7.5L14.5 9.5M9.5 14.5L7.5 16.5" stroke="url(#optoAiGrad)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
};

/**
 * LensIQIcon - AI Lens Decision Support
 * Depicts an ophthalmic meniscus lens profile with dual refractive rays converging at a focal point.
 */
export const LensIQIcon: React.FC<IconProps> = ({ size = 16, className = '', style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="lensIqGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      {/* Ophthalmic Lens Curvature */}
      <path
        d="M6 3C11 7 13 17 6 21C14 20 18 15 18 12C18 9 14 4 6 3Z"
        fill="rgba(2, 132, 199, 0.15)"
        stroke="url(#lensIqGrad)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Refraction Rays & Focal Point */}
      <circle cx="14" cy="12" r="2.2" fill="url(#lensIqGrad)" />
      <path d="M2 12H7M16.5 12H22" stroke="url(#lensIqGrad)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

/**
 * OptoForecastIcon - AI Inventory Predictive Demand Intelligence
 * Depicts dynamic inventory telemetry and predictive restocking forecast trajectory.
 */
export const OptoForecastIcon: React.FC<IconProps> = ({ size = 16, className = '', style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="forecastGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>
      {/* Predictive Trend Vector */}
      <path
        d="M3 17L8.5 11.5L12.5 15.5L20 7M20 7H15M20 7V12"
        stroke="url(#forecastGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stock Inventory Base */}
      <rect x="3" y="19" width="18" height="2" rx="1" fill="url(#forecastGrad)" opacity="0.6" />
      <circle cx="8.5" cy="11.5" r="1.5" fill="url(#forecastGrad)" />
      <circle cx="12.5" cy="15.5" r="1.5" fill="url(#forecastGrad)" />
    </svg>
  );
};

/**
 * OptoRecallIcon - AI Patient Retention & Clinical Recall Intelligence
 * Depicts a continuous circular retention loop with an optical vision consultation node.
 */
export const OptoRecallIcon: React.FC<IconProps> = ({ size = 16, className = '', style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="recallGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      {/* Retention Orbit */}
      <path
        d="M21 12A9 9 0 0 0 6 5.3L4 7M4 3V7H8"
        stroke="url(#recallGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12A9 9 0 0 0 18 18.7L20 17M20 21V17H16"
        stroke="url(#recallGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Patient Eye Consultation Glyph in Center */}
      <circle cx="12" cy="12" r="2.5" fill="url(#recallGrad)" />
    </svg>
  );
};

/**
 * OptoTriageIcon - Clinical & Stock Decision Engine Triage Icon
 * Depicts an intelligent priority target with an analytical focus node.
 */
export const OptoTriageIcon: React.FC<IconProps> = ({ size = 16, className = '', style }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="triageGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="8.5" stroke="url(#triageGrad)" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.2" fill="url(#triageGrad)" />
      <path d="M12 2V5M12 19V22M2 12H5M19 12H22" stroke="url(#triageGrad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
