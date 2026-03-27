import { useState, useEffect } from 'react';

/**
 * useEnergyMode — Metabolic Components (Eco-Mode)
 * 
 * Reads device battery level and network connection quality.
 * Returns 'high', 'medium', or 'low' — components use this to
 * disable heavy animations and simplify gradients when resources are scarce.
 * 
 * Sets data-energy attribute on <body> for CSS overrides.
 */
export function useEnergyMode() {
  const [mode, setMode] = useState('high');

  useEffect(() => {
    let battery = null;

    function classify() {
      const connection = navigator.connection?.effectiveType;
      const level = battery?.level ?? 1;
      const charging = battery?.charging ?? true;

      let energy = 'high';

      // Low battery + not charging → eco mode
      if (level <= 0.15 && !charging) {
        energy = 'low';
      } else if (level <= 0.3 && !charging) {
        energy = 'medium';
      }

      // Slow network also triggers eco mode
      if (connection === '2g' || connection === 'slow-2g') {
        energy = 'low';
      } else if (connection === '3g' && energy !== 'low') {
        energy = 'medium';
      }

      setMode(energy);
      document.body.setAttribute('data-energy', energy);
    }

    // Battery API
    if ('getBattery' in navigator) {
      navigator.getBattery().then(b => {
        battery = b;
        classify();
        b.addEventListener('levelchange', classify);
        b.addEventListener('chargingchange', classify);
      });
    }

    // Network Information API
    if (navigator.connection) {
      navigator.connection.addEventListener('change', classify);
    }

    classify(); // Initial run

    return () => {
      if (battery) {
        battery.removeEventListener('levelchange', classify);
        battery.removeEventListener('chargingchange', classify);
      }
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', classify);
      }
    };
  }, []);

  return mode;
}
