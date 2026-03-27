import matter from 'gray-matter';

import buildFasterRaw from '../../../content/articles/lowdefy-4-6-build-faster-break-less.md';
import jsonParseRaw from '../../../content/articles/lowdefy-4-7-faster-builds-json-parse.md';
import yamlAiEraRaw from '../../../content/articles/yaml-best-language-ai-era.md';

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
  parseArticle('lowdefy-4-6-build-faster-break-less', buildFasterRaw),
  parseArticle('lowdefy-4-7-faster-builds-json-parse', jsonParseRaw),
  parseArticle('yaml-best-language-ai-era', yamlAiEraRaw),
]
  .filter((a) => !a.draft)
  .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

export default articles;
