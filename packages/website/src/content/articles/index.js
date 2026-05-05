import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';

const slugs = [
  'lowdefy-4-6-build-faster-break-less',
  'lowdefy-4-7-faster-builds-json-parse',
  'yaml-best-language-ai-era',
  'what-can-you-build-in-50-lines-of-yaml',
  'case-for-config-driven-development',
  'lowdefy-5-whats-new',
  'demo-to-production-lowdefy',
  'lowdefy-5-2-drop-in-modules',
];

function loadArticle(slug) {
  const raw = readFileSync(join(process.cwd(), 'content/articles', `${slug}.md`), 'utf8');
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

const articles = slugs
  .map(loadArticle)
  .filter((a) => !a.draft)
  .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

export default articles;
