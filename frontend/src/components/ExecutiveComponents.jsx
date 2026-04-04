import React from 'react';
import { motion } from 'framer-motion';

/**
 * ExecutiveCard: The high-density professional container.
 * Features subtle slate borders, deep indigo depth, and clear hierarchy.
 */
export const ExecutiveCard = ({ children, className = '', hover = true, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={`relative overflow-hidden bg-slate-900/40 border border-slate-800/60 rounded-xl shadow-lg backdrop-blur-md ${hover ? 'hover:border-indigo-500/30 hover:bg-slate-900/60' : ''} transition-all duration-200 ${className}`}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

/**
 * ExecutiveButton: Professional action triggers with Indigo brand accents.
 */
export const ExecutiveButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  className = '',
  icon: Icon,
  onClick,
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden inline-flex items-center justify-center gap-2 font-display font-medium transition-all duration-200 rounded-lg active:scale-95";
  
  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2', 
    lg: 'text-base px-7 py-3',
  };

  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm border border-indigo-500/20",
    neon: "bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 shadow-sm",
    ghost: "bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent hover:border-slate-700",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
    outline: "bg-transparent text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10"
  };

  return (
    <motion.button
      onClick={onClick}
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className} ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 14 : 18} className="opacity-80" />}
          <span className="relative z-10">{children}</span>
        </>
      )}
    </motion.button>
  );
};

/**
 * ExecutiveStat: Professional KPI metrics.
 */
export const ExecutiveStat = ({ label, value, subValue, icon: Icon, delay = 0 }) => {
  return (
    <ExecutiveCard delay={delay} className="flex flex-col gap-1 p-5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && <div className="text-indigo-400 opacity-60"><Icon size={16} /></div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-display font-medium tracking-tight text-white">{value}</span>
      </div>
      {subValue && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-emerald-400 font-medium">{subValue}</span>
          <span className="text-[10px] text-slate-600">vs last period</span>
        </div>
      )}
    </ExecutiveCard>
  );
};

/**
 * ExecutiveBadge: Clean status indicators.
 */
export const ExecutiveBadge = ({ children, variant = 'indigo', className = '' }) => {
  const variants = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    white: 'bg-slate-800 text-slate-300 border-slate-700',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};



