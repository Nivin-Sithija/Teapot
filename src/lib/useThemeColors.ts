'use client';

import { useEffect, useState } from 'react';

/**
 * Resolves theme tokens from CSS custom properties so the 3D scene stays in
 * step with the page. Re-reads on system theme change and on `data-theme`
 * mutations, which is what makes the ground and fog flip with the rest of the UI.
 */
export function useThemeColors() {
  const [colors, setColors] = useState({ paper: '#f5f3ea', fog: '#eceadd', ink: '#212e26' });

  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      const get = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
      setColors({
        paper: get('--color-paper', '#f5f3ea'),
        fog: get('--scene-fog', '#eceadd'),
        ink: get('--color-ink', '#212e26'),
      });
    };

    read();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', read);

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      media.removeEventListener('change', read);
      observer.disconnect();
    };
  }, []);

  return colors;
}
