import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.bhoomitayi.com';
  
  // List all main public routes
  const routes = [
    '',
    '/about',
    '/contact',
    '/houses',
    '/land',
    '/commercial',
    '/pg',
    '/vehicles',
    '/commodities',
    '/sell',
    '/privacy',
    '/terms',
    '/glossary',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));
}
