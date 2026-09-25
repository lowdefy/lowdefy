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

import { jest } from '@jest/globals';

// searchIcons reads the dev build's iconAliases.json, which only exists in a
// built server directory. The react-icons packages are real.
const mockReadBuildArtifact = jest.fn();
jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: mockReadBuildArtifact,
}));

const { default: searchIcons } = await import('./searchIcons.js');

beforeEach(() => {
  mockReadBuildArtifact.mockReset();
});

test('searchIcons lists matching semantic names before react-icons names', () => {
  mockReadBuildArtifact.mockReturnValue({ delete: 'LuTrash2', edit: 'LuPencil' });
  const result = searchIcons({ query: 'trash' });
  expect(result.aliases).toEqual([{ name: 'delete', icon: 'LuTrash2' }]);
  expect(result.icons[0]).toBe('LuTrash');
  expect(result.icons).toContain('LuTrash2');
});

test('searchIcons includes theme aliases from the build', () => {
  mockReadBuildArtifact.mockReturnValue({ invoice: 'LuReceipt' });
  const result = searchIcons({ query: 'invoice' });
  expect(result.aliases).toEqual([{ name: 'invoice', icon: 'LuReceipt' }]);
});

test('searchIcons falls back to the built-in names before the first build', () => {
  mockReadBuildArtifact.mockReturnValue(null);
  const result = searchIcons({ query: 'external link' });
  expect(result.aliases).toEqual([{ name: 'external-link', icon: 'LuExternalLink' }]);
});

test('searchIcons requires every query word to match', () => {
  mockReadBuildArtifact.mockReturnValue({});
  const result = searchIcons({ query: 'arrow right circle', limit: 50 });
  expect(result.icons.length).toBeGreaterThan(0);
  result.icons.forEach((name) => {
    const lower = name.toLowerCase();
    expect(lower).toContain('arrow');
    expect(lower).toContain('right');
    expect(lower).toContain('circle');
  });
});

test('searchIcons caps react-icons results at the limit', () => {
  mockReadBuildArtifact.mockReturnValue({});
  expect(searchIcons({ query: 'user', limit: 5 }).icons).toHaveLength(5);
});

test('searchIcons throws without a query', () => {
  expect(() => searchIcons({ query: ' ' })).toThrow('searchIcons requires a "query" string.');
});

test('every built-in semantic icon name targets an icon react-icons exports', async () => {
  // react-icons upgrades have renamed Lucide exports (LuHome → LuHouse); this
  // catches a built-in name that would stop rendering.
  const { defaultIconAliases } = await import('@lowdefy/build/dev');
  const { createRequire } = await import('node:module');
  const lucide = createRequire(import.meta.url)('react-icons/lu');
  const missing = Object.entries(defaultIconAliases).filter(([, icon]) => !lucide[icon]);
  expect(missing).toEqual([]);
});
