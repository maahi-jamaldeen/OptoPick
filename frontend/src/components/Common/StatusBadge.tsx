import React from 'react';
import { Check, AlertTriangle, X, Info, Package, Clock, Shield } from 'lucide-react';
import { OptoPickAIIcon, LensIQIcon, OptoForecastIcon, OptoRecallIcon, OptoTriageIcon } from './OptoIcons';

export type BadgeVariant = 'ok' | 'warn' | 'bad' | 'info' | 'ai' | 'neutral';

export interface StatusBadgeProps {
  variant?: BadgeVariant;
  status?: 'ACTIVE' | 'WARNING' | 'CRITICAL' | 'INFO' | string;
  label: string;
  icon?: 'check' | 'alert' | 'x' | 'info' | 'sparkles' | 'package' | 'clock' | 'shield' | 'opto-ai' | 'lens-iq' | 'forecast' | 'recall' | 'triage';
  className?: string;
  style?: React.CSSProperties;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  status,
  label,
  icon,
  className = '',
  style,
}) => {
  // Map legacy status strings to Refraction badge variants if variant is not explicitly passed
  const resolvedVariant: BadgeVariant = variant || (() => {
    if (!status) return 'neutral';
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'PAID':
      case 'IN_STOCK':
      case 'APPROVED':
      case 'COLLECTED':
        return 'ok';
      case 'WARNING':
      case 'PENDING':
      case 'PARTIALLY_PAID':
      case 'LOW_STOCK':
      case 'DRAFT_PENDING_APPROVAL':
        return 'warn';
      case 'CRITICAL':
      case 'OUT_OF_STOCK':
      case 'FAILED':
      case 'CANCELLED':
        return 'bad';
      case 'INFO':
      case 'DISPATCHED':
      case 'ORDER_PLACED':
      case 'READY_FOR_COLLECTION':
        return 'info';
      default:
        return 'neutral';
    }
  })();

  const getIcon = () => {
    const size = 13;
    const selectedIcon = icon || (() => {
      switch (resolvedVariant) {
        case 'ok':
          return 'check';
        case 'warn':
          return 'alert';
        case 'bad':
          return 'x';
        case 'info':
          return 'info';
        case 'ai':
          return 'opto-ai';
        default:
          return undefined;
      }
    })();

    switch (selectedIcon) {
      case 'check':
        return <Check size={size} />;
      case 'alert':
        return <AlertTriangle size={size} />;
      case 'x':
        return <X size={size} />;
      case 'info':
        return <Info size={size} />;
      case 'opto-ai':
        return <OptoPickAIIcon size={size} />;
      case 'triage':
        return <OptoTriageIcon size={size} />;
      case 'lens-iq':
        return <LensIQIcon size={size} />;
      case 'forecast':
        return <OptoForecastIcon size={size} />;
      case 'recall':
        return <OptoRecallIcon size={size} />;
      case 'package':
        return <Package size={size} />;
      case 'clock':
        return <Clock size={size} />;
      case 'shield':
        return <Shield size={size} />;
      default:
        return null;
    }
  };

  const iconEl = getIcon();

  return (
    <span className={`badge b-${resolvedVariant} ${className}`} style={style}>
      {iconEl}
      <span>{label}</span>
    </span>
  );
};
