import { useState, useEffect } from 'react';

/**
 * useTidalMode — Chronobiological Layout Adaptation
 * 
 * Classifies the current hour into cognitive zones:
 *   peak:      6am – 12pm (morning focus)
 *   trough:    12pm – 5pm (post-lunch dip)
 *   wind-down: 5pm – 6am (evening/night)
 * 
 * Sets data-tidal attribute on <body> for CSS variable overrides
 * that subtly adjust spacing, font size, and density.
 * 
 * Users can override manually via the returned setOverride function.
 */
export function useTidalMode() {
  const [mode, setMode]           = useState('peak');
  const [override, setOverride]   = useState(null); // manual override

  useEffect(() => {
    function classify() {
      if (override) {
        setMode(override);
        document.body.setAttribute('data-tidal', override);
        return;
      }

      const hour = new Date().getHours();
      let tidal;

      if (hour >= 6 && hour < 12) {
        tidal = 'peak';
      } else if (hour >= 12 && hour < 17) {
        tidal = 'trough';
      } else {
        tidal = 'wind-down';
      }

      setMode(tidal);
      document.body.setAttribute('data-tidal', tidal);
    }

    classify(); // Initial

    // Re-classify every 15 minutes
    const interval = setInterval(classify, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [override]);

  return { mode, setOverride };
}
