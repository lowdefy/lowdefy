import articleOgImage from '@/components/articleOgImage';
import articles from '@/content/articles';

const article = articles.find((a) => a.id === 'what-can-you-build-in-50-lines-of-yaml');

export const alt = article.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return articleOgImage({
    title: article.title,
    subtitle: article.subtitle,
    tags: article.tags,
  });
}
