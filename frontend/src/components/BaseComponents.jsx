import React from 'react';
import { motion } from 'framer-motion';

/**
 * ProCard: Standardized professional card with hover states 
 * and hardware-accelerated transitions.
 */
export const ProCard = ({ children, className = '', hover = true, ...props }) => {
  return (
    <div 
      className={`card ${hover ? 'hover:border-border-focus' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ProButton: Standardized premium button with 44px touch target compliance.
 */
export const ProButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  className = '',
  icon: Icon,
  ...props 
}) => {
  const sizes = {
    sm: 'btn-sm',
    md: '', 
    lg: 'btn-lg',
  };

  return (
    <button
      className={`btn btn-${variant} ${sizes[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="spinner spinner-sm border-t-transparent" />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
          {children}
        </>
      )}
    </button>
  );
};

/**
 * ProBadge: High-contrast professional status badges.
 */
export const ProBadge = ({ children, variant = 'muted', className = '' }) => {
  const variants = {
    success: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20',
    warning: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20',
    danger: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
    accent: 'bg-white text-black',
    muted: 'bg-[#27272a] text-[#a1a1aa] border-[#27272a]',
  };

  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-md text-[10px] 
      font-black uppercase tracking-widest border ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  );
};

/**
 * ProStat: Professional KPI display for dashboards.
 */
export const ProStat = ({ label, value, subValue, icon: Icon, trend }) => {
  return (
    <ProCard className="flex flex-col gap-1">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-muted uppercase tracking-widest">{label}</span>
        {Icon && <div className="p-2 rounded-lg bg-white/5 text-accent"><Icon size={18} /></div>}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-2xl font-black text-primary tracking-tight">{value}</span>
        {trend && (
          <span className={`text-[10px] font-bold ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {subValue && <span className="text-xs text-muted font-medium">{subValue}</span>}
    </ProCard>
  );
};

/**
 * ProRow: High-density data row for lists and tables.
 * Optimized for 44px touch targets on mobile.
 */
export const ProRow = ({ children, className = '', onClick, selected = false, ...props }) => {
  return (
    <div 
      className={`
        group flex items-center gap-4 p-4 rounded-md border border-border 
        hover:border-border-focus hover:bg-bg-elevated cursor-pointer 
        transition-all duration-200 ${selected ? 'border-primary bg-bg-elevated' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ProFilterGroup: Tab-style filter container.
 */
export const ProFilterGroup = ({ children, className = '' }) => {
  return (
    <div className={`
      inline-flex items-center gap-1 p-1 rounded-md bg-bg-surface border border-border
      ${className}
    `}>
      {children}
    </div>
  );
};
