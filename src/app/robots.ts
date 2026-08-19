import type { MetadataRoute } from 'next';

const BASE = 'https://ushbyushuaia-catalogo-mayorista.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/profile', '/checkout'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}