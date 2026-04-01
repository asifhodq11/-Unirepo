import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Activity, Signal, SignalLow, SignalHigh, AlertTriangle } from 'lucide-react';

export default function NetworkHealthCheck() {
  const [status, setStatus] = useState('checking'); // checking, online, offline, degraded
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    async function checkHealth() {
      const start = Date.now();
      try {
        // We use a light ping endpoint or even just /poller/status
        await api.get('/auth/me'); // Simple auth check acts as a health ping
        setLatency(Date.now() - start);
        setStatus('online');
      } catch (err) {
        setStatus('offline');
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (status === 'online') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass text-[10px] font-bold uppercase tracking-widest text-success border border-success/20">
        <SignalHigh size={12} />
        <span>API Live ({latency}ms)</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/10 text-[10px] font-bold uppercase tracking-widest text-danger border border-danger/30 animate-pulse">
        <AlertTriangle size={12} />
        <span>API Network Error</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass text-[10px] font-bold uppercase tracking-widest text-muted border border-border">
      <Activity size={12} className="animate-spin" />
      <span>Syncing...</span>
    </div>
  );
}
