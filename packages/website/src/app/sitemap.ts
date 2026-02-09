import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://lowdefy.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
