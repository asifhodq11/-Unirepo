import React from 'react';
import { motion } from 'framer-motion';

/**
 * ProCard: Standardized professional card with hover states 
 * and hardware-accelerated transitions.
 */
export const ProCard = ({ children, className = '', hover = true, ...props }) => {
  return (
    <div 
      className={`card ${hover ? 'hover:border-primary/20' : ''} ${className}`} 
      style={{ transform: 'var(--gpu-accel)' }}
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
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover shadow-glow',
    secondary: 'bg-bg-surface border border-border text-primary hover:bg-white/10',
    ghost: 'bg-transparent text-muted hover:text-primary hover:bg-white/5',
    danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-11 px-6 text-sm', // Meets 44px target
    lg: 'h-14 px-8 text-base font-bold',
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium 
        transition-all duration-200 active:scale-95 disabled:opacity-50 
        disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}
      `}
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
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
    muted: 'bg-white/5 text-muted border-white/10',
  };

  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full text-[10px] 
      font-bold uppercase tracking-wider border ${variants[variant]} ${className}
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
        group flex items-center gap-4 p-4 rounded-xl border border-border 
        hover:border-accent/40 hover:bg-white/[0.02] cursor-pointer 
        transition-all duration-200 ${selected ? 'border-accent bg-accent/5' : ''}
        ${className}
      `}
      onClick={onClick}
      style={{ transform: 'translateZ(0)' }}
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
      inline-flex items-center gap-1 p-1 rounded-xl bg-bg-surface border border-border
      ${className}
    `}>
      {children}
    </div>
  );
};
