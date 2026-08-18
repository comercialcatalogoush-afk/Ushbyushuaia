'use client';

import { useEffect } from 'react';
import { useSiteTheme } from '@/lib/siteContentHooks';

// Aplica el tema guardado (colores de marca) como CSS variables en <html>.
// Así, cambiar el color en el panel admin actualiza TODO el sitio al instante.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useSiteTheme();
  return <>{children}</>;
}