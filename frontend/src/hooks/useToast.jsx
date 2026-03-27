import { createContext, useContext, useState, useCallback } from 'react';

/**
 * useToast — Global notification system
 * 
 * Usage:
 *   const toast = useToast();
 *   toast.success('Settings saved');
 *   toast.error('Generation failed');
 *   toast.warning('Quota almost reached');
 *   toast.info('Tip: try different star ratings');
 */

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message }]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.map(t =>
        t.id === id ? { ...t, exiting: true } : t
      ));
      // Remove from DOM after exit animation
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 200);
    }, duration);
  }, []);

  const toast = {
    success: (msg) => addToast('success', msg),
    error:   (msg) => addToast('error', msg, 6000),
    warning: (msg) => addToast('warning', msg, 5000),
    info:    (msg) => addToast('info', msg),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container — renders at top-right */}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : ''}`}
          >
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
