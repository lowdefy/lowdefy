import articles from '@/content/articles';

export default function sitemap() {
  const articlePages = articles.map((article) => ({
    url: `https://lowdefy.com/articles/${article.id}`,
    lastModified: article.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: 'https://lowdefy.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://lowdefy.com/articles',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...articlePages,
  ];
}
