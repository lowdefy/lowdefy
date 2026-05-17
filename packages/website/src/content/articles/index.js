import 'server-only';

import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';
import { toString as mdastToString } from 'mdast-util-to-string';

import buildFasterRaw from '../../../content/articles/lowdefy-4-6-build-faster-break-less.md';
import jsonParseRaw from '../../../content/articles/lowdefy-4-7-faster-builds-json-parse.md';
import yamlAiEraRaw from '../../../content/articles/yaml-best-language-ai-era.md';
import fiftyLinesRaw from '../../../content/articles/what-can-you-build-in-50-lines-of-yaml.md';
import configDrivenRaw from '../../../content/articles/case-for-config-driven-development.md';
import v5WhatsNewRaw from '../../../content/articles/lowdefy-5-whats-new.md';
import demoToProductionRaw from '../../../content/articles/demo-to-production-lowdefy.md';
import dropInModulesRaw from '../../../content/articles/lowdefy-5-2-drop-in-modules.md';
import lowdefyAgentsRaw from '../../../content/articles/lowdefy-agents.md';
import wordleInYamlRaw from '../../../content/articles/wordle-in-yaml.md';

function extractToc(markdown) {
  const tree = unified().use(remarkParse).parse(markdown);
  const slugger = new GithubSlugger();
  const items = [];
  let currentH2 = null;

  visit(tree, 'heading', (node) => {
    if (node.depth !== 2 && node.depth !== 3) return;
    const text = mdastToString(node);
    const id = slugger.slug(text);
    if (node.depth === 2) {
      currentH2 = { id, text, children: [] };
      items.push(currentH2);
    } else if (currentH2) {
      currentH2.children.push({ id, text });
    }
    // h3s before the first h2 are intentionally dropped.
  });
  return items;
}

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
    toc: extractToc(content),
    tocEnabled: data.toc !== false,
    markdown: content,
  };
}

const articles = [
  parseArticle('lowdefy-4-6-build-faster-break-less', buildFasterRaw),
  parseArticle('lowdefy-4-7-faster-builds-json-parse', jsonParseRaw),
  parseArticle('yaml-best-language-ai-era', yamlAiEraRaw),
  parseArticle('what-can-you-build-in-50-lines-of-yaml', fiftyLinesRaw),
  parseArticle('case-for-config-driven-development', configDrivenRaw),
  parseArticle('lowdefy-5-whats-new', v5WhatsNewRaw),
  parseArticle('demo-to-production-lowdefy', demoToProductionRaw),
  parseArticle('lowdefy-5-2-drop-in-modules', dropInModulesRaw),
  parseArticle('lowdefy-agents', lowdefyAgentsRaw),
  parseArticle('wordle-in-yaml', wordleInYamlRaw),
]
  .filter((a) => !a.draft)
  .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

export default articles;
