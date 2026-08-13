'use client';

import { useState, useEffect } from 'react';

// Devuelve cuántas tarjetas se muestran por vista según el ancho:
// <640px → 1 · 640-1023px → 2 · >=1024px → 3
export function useVisibleCards() {
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) setVisible(1);
      else if (w < 1024) setVisible(2);
      else setVisible(3);
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return visible;
}
