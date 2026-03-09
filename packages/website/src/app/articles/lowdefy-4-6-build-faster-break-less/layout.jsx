import articles from '@/content/articles';

const article = articles.find((a) => a.id === 'lowdefy-4-6-build-faster-break-less');

export const metadata = {
  title: `${article.title} | Lowdefy`,
  description: article.subtitle,
  openGraph: {
    title: article.title,
    description: article.subtitle,
    type: 'article',
    url: `https://lowdefy.com/articles/${article.id}`,
    siteName: 'Lowdefy',
    publishedTime: article.publishedAt.toISOString(),
    tags: article.tags,
  },
  twitter: {
    card: 'summary_large_image',
    title: article.title,
    description: article.subtitle,
    site: '@lowdefy',
    creator: '@lowdefy',
  },
};

export default function ArticleLayout({ children }) {
  return children;
}
