/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Runs inside the docs app build (see packages/docs/templates/generateSiteAssets.js),
// where pages are fully resolved: _refs inlined, template vars substituted.
// Markdown content lives on Markdown/MarkdownWithCode block properties in
// document order, so a plain block walk reconstructs each page as markdown.

function sectionKind(section) {
  if (section.endsWith('Blocks') || section === 'Controls') return 'block';
  if (section === 'Operators') return 'operator';
  if (section === 'Actions') return 'action';
  if (section === 'Connections') return 'connection';
  return undefined;
}

function resolvePageSections(pages, menus) {
  const sectionMap = new Map();
  function walkLinks(links, parentGroup) {
    (links ?? []).forEach((link) => {
      if (link.type === 'MenuGroup') {
        const group = { label: link.properties?.title ?? link.id };
        walkLinks(link.links, group);
      } else if (link.type === 'MenuLink' && link.pageId) {
        if (parentGroup) {
          sectionMap.set(link.pageId, parentGroup);
        }
      }
    });
  }
  (menus ?? []).forEach((menu) => {
    walkLinks(menu.links, null);
  });
  return sectionMap;
}

function extractPageMarkdown(page) {
  const parts = [];
  function collect(value) {
    // Unresolved runtime operators are objects — only static strings are docs content.
    if (typeof value === 'string' && value.trim() !== '') {
      parts.push(value.trim());
    }
  }
  function walkBlock(block) {
    if (!block) return;
    // page_title duplicates the manifest title emitted as the markdown h1.
    if (block.id === 'page_title') return;
    const props = block.properties ?? {};
    collect(props.content);
    if (typeof props.message === 'string') {
      collect(`> ${props.message}`);
    }
    (block.blocks ?? []).forEach(walkBlock);
    // header/footer slots and areas hold site chrome (menu, feedback, newsletter).
    for (const [name, area] of Object.entries(block.areas ?? {})) {
      if (name === 'header' || name === 'footer') continue;
      (area.blocks ?? []).forEach(walkBlock);
    }
    for (const [name, slot] of Object.entries(block.slots ?? {})) {
      if (name === 'header' || name === 'footer') continue;
      (slot.blocks ?? []).forEach(walkBlock);
    }
  }
  (page.blocks ?? []).forEach(walkBlock);
  return parts.join('\n\n');
}

function toSlugSegment(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractAgentDocs({ pages, menus, outputDir }) {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(dirname(fileURLToPath(import.meta.url)), '../package.json'), 'utf8')
  );
  const sectionMap = resolvePageSections(pages, menus);
  const contentDir = path.join(outputDir, 'content');
  fs.rmSync(contentDir, { recursive: true, force: true });

  const docs = [];
  pages.filter(Boolean).forEach((page) => {
    const title = page.properties?.title ?? page.id;
    const section = sectionMap.get(page.id)?.label ?? 'Other';
    const markdown = extractPageMarkdown(page);
    if (markdown === '') {
      return;
    }
    const slug = `${toSlugSegment(section)}/${toSlugSegment(page.id)}`;
    const filePath = `content/${slug}.md`;
    const absolutePath = path.join(outputDir, filePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, `# ${title}\n\n${markdown}\n`);

    const doc = { slug, title, section, path: filePath };
    const kind = sectionKind(section);
    if (kind) {
      doc.kind = kind;
      doc.typeName = title;
    }
    docs.push(doc);
  });

  fs.writeFileSync(
    path.join(outputDir, 'index.json'),
    JSON.stringify({ version: packageJson.version, docs }, null, 2)
  );
}

export default extractAgentDocs;
