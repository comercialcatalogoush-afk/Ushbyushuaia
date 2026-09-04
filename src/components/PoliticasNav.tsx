'use client';

import React, { useEffect, useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  accent?: 'default' | 'rose' | 'indigo';
}

interface PoliticasNavProps {
  items: NavItem[];
}

export const PoliticasNav: React.FC<PoliticasNavProps> = ({ items }) => {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // La sección visible (más cercana a la parte superior de la ventana) es la activa
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 }
    );

    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 120;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  const accentClasses: Record<string, string> = {
    default: 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100',
    rose: 'bg-rose-50 border-rose-200 text-[#c06579] hover:bg-rose-100',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100',
  };
  const activeClasses = 'bg-[#1b2333] border-[#1b2333] text-white hover:bg-[#1b2333]';

  return (
    <div className="sticky top-[64px] sm:top-[72px] z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
          {items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              onClick={(e) => handleClick(e, it.id)}
              aria-current={activeId === it.id ? 'true' : undefined}
              className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap transition-colors ${
                activeId === it.id ? activeClasses : accentClasses[it.accent || 'default']
              }`}
            >
              {it.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};