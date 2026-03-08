import matter from 'gray-matter';

import configFirstAiRaw from '../../../content/articles/why-config-first-is-the-future-of-ai-app-development.md';
import buildFasterRaw from '../../../content/articles/lowdefy-4-6-build-faster-break-less.md';

function parseArticle(slug, raw) {
  const { data, content } = matter(raw);
  return {
    id: slug,
    title: data.title,
    subtitle: data.subtitle,
    authorId: data.authorId,
    publishedAt: new Date(data.publishedAt),
    readTimeMinutes: data.readTimeMinutes,
    tags: data.tags,
    draft: data.draft,
    markdown: content,
  };
}

const articles = [
  parseArticle('why-config-first-is-the-future-of-ai-app-development', configFirstAiRaw),
  parseArticle('lowdefy-4-6-build-faster-break-less', buildFasterRaw),
]
  .filter((a) => !a.draft)
  .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

export default articles;
