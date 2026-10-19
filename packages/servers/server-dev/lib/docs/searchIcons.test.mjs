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

// searchIcons reads the dev build's iconAliases.json and customTypesMap.json,
// which only exist in a built server directory, and loads installed icon set
// plugins through the build's loader. Lucide's names are real.
const mockReadBuildArtifact = jest.fn();
jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: mockReadBuildArtifact,
}));

const buildDev = await import('@lowdefy/build/dev');
const mockLoadIconSets = jest.fn();
jest.unstable_mockModule('@lowdefy/build/dev', () => ({
  ...buildDev,
  loadIconSets: mockLoadIconSets,
}));

const { default: searchIcons } = await import('./searchIcons.js');

function layer(names) {
  return { names: new Set(names) };
}

function mockArtifacts({ aliases = null, iconSets = {} } = {}) {
  mockReadBuildArtifact.mockImplementation(({ name }) => {
    if (name === 'iconAliases.json') return aliases;
    if (name === 'customTypesMap.json') return { iconSets };
    return null;
  });
}

beforeEach(() => {
  mockReadBuildArtifact.mockReset();
  mockLoadIconSets.mockReset();
  mockLoadIconSets.mockResolvedValue({ lucide: [layer([])] });
});

test('searchIcons lists matching semantic names, then canonical Lucide names, then aliases', async () => {
  mockArtifacts({ aliases: { delete: 'Trash', edit: 'Pencil' } });
  const result = await searchIcons({ query: 'trash' });
  expect(result.semantic).toEqual([{ name: 'delete', icon: 'Trash' }]);
  expect(result.icons[0]).toBe('Trash');
  expect(result.icons).toContain('Trash2');
  // Trash2 is a canonical name in Lucide 1.x; aliases come after every canonical name.
  const { canonical } = buildDev.getLucideIconNames();
  const firstAlias = result.icons.findIndex((name) => !canonical.includes(name));
  if (firstAlias !== -1) {
    expect(result.icons.slice(firstAlias).every((name) => !canonical.includes(name))).toBe(true);
  }
});

test('searchIcons ranks canonical names before Lucide alias names', async () => {
  mockArtifacts();
  const result = await searchIcons({ query: 'house', limit: 100 });
  expect(result.icons).toContain('House');
  const home = await searchIcons({ query: 'home', limit: 100 });
  // Home is an alias of House.
  expect(home.icons).toContain('Home');
  expect(home.icons.indexOf('Home')).toBeGreaterThan(home.icons.indexOf('HousePlus'));
});

test('searchIcons includes theme aliases from the build', async () => {
  mockArtifacts({ aliases: { invoice: 'Receipt' } });
  const result = await searchIcons({ query: 'invoice' });
  expect(result.semantic).toEqual([{ name: 'invoice', icon: 'Receipt' }]);
});

test('searchIcons falls back to the built-in names before the first build', async () => {
  mockArtifacts();
  const result = await searchIcons({ query: 'external link' });
  expect(result.semantic).toEqual([{ name: 'external-link', icon: 'ExternalLink' }]);
});

test('searchIcons lists installed set names qualified, after Lucide names', async () => {
  const iconSets = { tabler: [{ package: '@acme/icons-tabler', version: '1.0.0' }] };
  mockArtifacts({ iconSets });
  mockLoadIconSets.mockResolvedValue({
    lucide: [layer(['Pencil']), layer(['PencilInvoice'])],
    tabler: [layer(['PencilBolt', 'Other'])],
  });
  const result = await searchIcons({ query: 'pencil', limit: 100 });
  expect(result.icons[0]).toBe('Pencil');
  // An icon a plugin adds to lucide is listed unqualified; other sets qualified.
  expect(result.icons.slice(-2)).toEqual(['PencilInvoice', 'tabler:PencilBolt']);
  expect(mockLoadIconSets).toHaveBeenCalledWith({
    context: { directories: { server: process.cwd() }, typesMap: { iconSets } },
  });
});

test('searchIcons requires every query word to match', async () => {
  mockArtifacts();
  const result = await searchIcons({ query: 'arrow right circle', limit: 50 });
  expect(result.icons.length).toBeGreaterThan(0);
  result.icons.forEach((name) => {
    const lower = name.toLowerCase();
    expect(lower).toContain('arrow');
    expect(lower).toContain('right');
    expect(lower).toContain('circle');
  });
});

test('searchIcons caps icon names at the limit', async () => {
  mockArtifacts();
  expect((await searchIcons({ query: 'user', limit: 5 })).icons).toHaveLength(5);
});

test('searchIcons throws without a query', async () => {
  await expect(searchIcons({ query: ' ' })).rejects.toThrow(
    'searchIcons requires a "query" string.'
  );
});
