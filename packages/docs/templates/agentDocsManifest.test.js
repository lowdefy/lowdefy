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

// @lowdefy/docs-content is generated from this docs app by `pnpm docs:content`
// (a full docs build) and committed, so nothing regenerates it when a page is
// added, removed or moved between menu sections. This test catches that drift
// without a docs build: every page linked from menus.yaml must have a doc in
// the manifest under its menu section, and every manifest doc filed under a
// menu section must still be linked from that section. Edits to the text of
// an existing page are not caught - that needs the full build.

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

// Must match toSlugSegment in @lowdefy/docs-content/scripts/extractAgentDocs.js.
function toSlugSegment(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Mirrors resolvePageSections in extractAgentDocs.js: a page's section is the
// menu group that directly holds its link.
function collectMenuPages(menus) {
  const pages = [];
  function walkLinks(links, group) {
    (links ?? []).forEach((link) => {
      if (link.type === 'MenuGroup') {
        walkLinks(link.links, link.properties?.title ?? link.id);
        return;
      }
      if (link.type === 'MenuLink' && link.pageId && group) {
        pages.push({ pageId: link.pageId, section: group });
      }
    });
  }
  menus.forEach((menu) => walkLinks(menu.links, null));
  return pages;
}

const menus = YAML.parse(fs.readFileSync(path.resolve('menus.yaml'), 'utf8'));
const manifest = JSON.parse(
  fs.readFileSync(path.resolve('node_modules/@lowdefy/docs-content/index.json'), 'utf8')
);
const menuPages = collectMenuPages(menus);
const manifestSlugs = new Set(manifest.docs.map((doc) => doc.slug));
const menuSlugs = new Set(
  menuPages.map(({ pageId, section }) => `${toSlugSegment(section)}/${toSlugSegment(pageId)}`)
);
const menuSections = new Set(menuPages.map(({ section }) => section));

test('menus.yaml links pages for the manifest check', () => {
  expect(menuPages.length).toBeGreaterThan(300);
});

test('every page in the docs menu has a doc in @lowdefy/docs-content - run `pnpm docs:content` when this fails', () => {
  const missing = [...menuSlugs].filter((slug) => !manifestSlugs.has(slug));
  expect(missing).toEqual([]);
});

test('every @lowdefy/docs-content doc in a menu section is still in the docs menu - run `pnpm docs:content` when this fails', () => {
  const removed = manifest.docs
    .filter((doc) => menuSections.has(doc.section))
    .filter((doc) => !menuSlugs.has(doc.slug))
    .map((doc) => doc.slug);
  expect(removed).toEqual([]);
});
