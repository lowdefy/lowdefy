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
import path from 'path';

import getDocsManifest from './getDocsManifest.js';
import searchDocs from './searchDocs.js';

// The order the substring search gave before terms: title or slug matches,
// then body matches, each in manifest order.
function substringOrder(query) {
  const manifest = getDocsManifest();
  const lowerQuery = query.toLowerCase();
  const titleMatches = [];
  const bodyMatches = [];
  for (const doc of manifest.docs) {
    const content = fs.readFileSync(path.join(manifest.contentDir, doc.path), 'utf8');
    if (doc.title.toLowerCase().includes(lowerQuery) || doc.slug.includes(lowerQuery)) {
      titleMatches.push(doc.slug);
    } else if (content.toLowerCase().includes(lowerQuery)) {
      bodyMatches.push(doc.slug);
    }
  }
  return [...titleMatches, ...bodyMatches].slice(0, 20);
}

test('searchDocs finds a page from a multi-word query', () => {
  const results = searchDocs({ query: 'Link action pathParams path parameters' });
  expect(results[0].slug).toEqual('actions/link');
});

test('searchDocs ranks entries matching more terms first', () => {
  const results = searchDocs({ query: 'MongoDB aggregation pipeline' });
  expect(results[0].slug).toEqual('connections/mongodb');
});

test('searchDocs keeps the substring order for a single-term query', () => {
  for (const query of ['SetState', 'modal', 'pathParams']) {
    expect(searchDocs({ query }).map((hit) => hit.slug)).toEqual(substringOrder(query));
  }
});

test('searchDocs leaves out entries matching no term', () => {
  expect(searchDocs({ query: 'zzqqxx wwvvyy' })).toEqual([]);
});

test('searchDocs searches the whole query when every term is dropped', () => {
  const results = searchDocs({ query: 'to a' });
  expect(results.length).toBeGreaterThan(0);
  expect(results.map((hit) => hit.slug)).toEqual(substringOrder('to a'));
});

test('searchDocs hits name their source, package and version', () => {
  const [hit] = searchDocs({ query: 'SetState' });
  expect(hit).toEqual(
    expect.objectContaining({
      slug: 'actions/setstate',
      source: 'core',
      package: '@lowdefy/docs-content',
      version: getDocsManifest().version,
      path: 'content/actions/setstate.md',
    })
  );
  expect(hit.snippet.startsWith('# SetState')).toBe(true);
});

test('searchDocs snippet surrounds the first body match when no title matches', () => {
  const results = searchDocs({ query: 'placeholders' });
  const bodyHit = results.find((hit) => !hit.title.toLowerCase().includes('placeholders'));
  expect(bodyHit.snippet.toLowerCase()).toContain('placeholders');
});

test('searchDocs source filter narrows hits to that source', () => {
  expect(searchDocs({ query: 'SetState', source: 'core' }).length).toBeGreaterThan(0);
  expect(searchDocs({ query: 'SetState', source: 'module' })).toEqual([]);
});

test('searchDocs throws on an unknown source, naming the sources', () => {
  expect(() => searchDocs({ query: 'SetState', source: 'blog' })).toThrow(
    'Unknown docs source. Received "blog". Use one of: core, plugin, local-plugin, module.'
  );
});

test('searchDocs throws on an empty query', () => {
  expect(() => searchDocs({ query: '  ' })).toThrow('requires a "query" string');
});
