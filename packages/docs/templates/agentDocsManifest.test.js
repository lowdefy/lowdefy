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
// added, removed, moved between menu sections or edited. This test catches
// that drift without a docs build: every page linked from menus.yaml must have
// a doc in the manifest under its menu section, every manifest doc filed under
// a menu section must still be linked from that section, and the files each
// doc was extracted from (recorded with their hash at extraction) must hash
// the same today.

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import hashDocSources from '@lowdefy/docs-content/scripts/hashDocSources.js';
import resolvePageSections from '@lowdefy/docs-content/scripts/resolvePageSections.js';
import sectionKind from '@lowdefy/docs-content/scripts/sectionKind.js';

import walkMenus from './walkMenus.js';
import { expect, test } from 'vitest';

// Must match toSlugSegment in @lowdefy/docs-content/scripts/extractAgentDocs.js.
function toSlugSegment(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function collectMenuPages(menus) {
  return [...resolvePageSections({ menus }).entries()].map(([pageId, section]) => ({
    pageId,
    section,
  }));
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

test('every @lowdefy/docs-content doc matches the page files it was extracted from - run `pnpm docs:content` when this fails', () => {
  const stale = manifest.docs
    .filter((doc) => {
      const recorded = manifest.sources?.[doc.slug];
      if (recorded?.hash === undefined) {
        return true;
      }
      return (
        hashDocSources({ configDirectory: path.resolve('.'), files: recorded.files }) !==
        recorded.hash
      );
    })
    .map((doc) => doc.slug);
  expect(stale).toEqual([]);
});

test('every menu page has a docsSection, so no doc falls back to other/', () => {
  const sectioned = new Set(menuPages.map(({ pageId }) => pageId));
  const unsectioned = [...walkMenus(menus).membershipCounts.keys()].filter(
    (pageId) => !sectioned.has(pageId)
  );
  expect(unsectioned).toEqual([]);
  expect(manifest.docs.filter((doc) => doc.section === 'Other').map((doc) => doc.slug)).toEqual([]);
});

test('the doc paths agents are told to request resolve in @lowdefy/docs-content', () => {
  ['operators/_get', 'operators/_if', 'concepts/lowdefy-schema', 'concepts/blocks'].forEach(
    (slug) => {
      expect(manifestSlugs.has(slug)).toBe(true);
    }
  );
});

const fixtureMenus = [
  {
    id: 'menu-reference',
    properties: { title: 'Reference', docsSection: 'Reference' },
    links: [
      { id: 'cli', type: 'MenuLink', pageId: 'cli' },
      {
        id: 'operators-group',
        type: 'MenuGroup',
        properties: { title: 'Operators', docsSection: 'Operators' },
        links: [
          {
            id: 'operators-reference',
            type: 'MenuLink',
            pageId: 'operators-reference',
            properties: { title: 'Overview', docsSection: 'Reference' },
          },
          {
            id: 'operators-logic',
            type: 'MenuGroup',
            properties: { title: 'Logic & control' },
            links: [
              {
                id: 'operators-nested',
                type: 'MenuGroup',
                properties: { title: 'Nested' },
                links: [{ id: '_if', type: 'MenuLink', pageId: '_if' }],
              },
            ],
          },
        ],
      },
      { id: 'external', type: 'MenuLink', url: 'https://lowdefy.com' },
    ],
  },
  {
    id: 'menu-untagged',
    properties: { title: 'Untagged' },
    links: [
      {
        id: 'group',
        type: 'MenuGroup',
        properties: { title: 'Group' },
        links: [{ id: 'loose', type: 'MenuLink', pageId: 'loose' }],
      },
    ],
  },
];

test('resolvePageSections takes a link docsSection over its group and menu', () => {
  const sections = resolvePageSections({ menus: fixtureMenus });
  expect(sections.get('operators-reference')).toBe('Reference');
});

test('resolvePageSections inherits a group docsSection through nested untagged groups', () => {
  const sections = resolvePageSections({ menus: fixtureMenus });
  expect(sections.get('_if')).toBe('Operators');
});

test('resolvePageSections falls back to the menu docsSection for pages in no tagged group', () => {
  const sections = resolvePageSections({ menus: fixtureMenus });
  expect(sections.get('cli')).toBe('Reference');
});

test('resolvePageSections ignores group titles and leaves untagged pages without a section', () => {
  const sections = resolvePageSections({ menus: fixtureMenus });
  expect(sections.has('loose')).toBe(false);
  expect([...sections.keys()].sort()).toEqual(['_if', 'cli', 'operators-reference']);
});

test('sectionKind gives a plugin type only to plugin sections, not Reference', () => {
  expect(sectionKind({ section: 'Operators' })).toBe('operator');
  expect(sectionKind({ section: 'Actions' })).toBe('action');
  expect(sectionKind({ section: 'Connections' })).toBe('connection');
  expect(sectionKind({ section: 'Controls' })).toBe('block');
  expect(sectionKind({ section: 'Input Blocks' })).toBe('block');
  expect(sectionKind({ section: 'Reference' })).toBeUndefined();
  expect(sectionKind({ section: 'Other' })).toBeUndefined();
});
