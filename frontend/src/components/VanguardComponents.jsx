import React from 'react';
import { motion } from 'framer-motion';

/**
 * VanguardCard: The ethereal glass bento container.
 * Features ultra-heavy blur, sub-pixel borders, and floating noise textures.
 */
export const VanguardCard = ({ children, className = '', hover = true, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={`card relative overflow-hidden bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-xl ${hover ? 'hover:border-white/20 hover:scale-[1.01] hover:-translate-y-1' : ''} transition-all duration-300 ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none rounded-2xl" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

/**
 * VanguardButton: Intense interaction buttons with cyan/purple glow states.
 */
export const VanguardButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false,
  className = '',
  icon: Icon,
  onClick,
  ...props 
}) => {
  const baseClasses = "relative overflow-hidden inline-flex items-center justify-center gap-2 font-display font-semibold transition-all duration-300 rounded-full";
  
  const sizes = {
    sm: 'text-xs px-4 py-2',
    md: 'text-sm px-6 py-2.5', 
    lg: 'text-base px-8 py-3.5',
  };

  const variants = {
    primary: "bg-white text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]",
    neon: "bg-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_rgba(34,211,238,0.8)]",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5 border border-white/10 hover:border-white/20",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`}
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
          {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
          <span className="relative z-10">{children}</span>
        </>
      )}
      
      {/* Shine effect overlay */}
      {variant !== 'ghost' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-shine pointer-events-none" />
      )}
    </motion.button>
  );
};

/**
 * VanguardStat: Minimalist, hyper-legible KPI metrics.
 */
export const VanguardStat = ({ label, value, subValue, icon: Icon, delay = 0 }) => {
  return (
    <VanguardCard delay={delay} className="flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">{label}</span>
        {Icon && <div className="text-cyan-400"><Icon size={18} /></div>}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="text-4xl font-display font-light tracking-tight text-white">{value}</span>
      </div>
      {subValue && <span className="text-xs text-white/40 font-mono uppercase tracking-wider">{subValue}</span>}
    </VanguardCard>
  );
};

/**
 * VanguardBadge: Luminescent metric tags.
 */
export const VanguardBadge = ({ children, variant = 'cyan', className = '' }) => {
  const variants = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    white: 'bg-white/10 text-white border-white/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-[6px] text-[10px] font-mono uppercase tracking-widest border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
