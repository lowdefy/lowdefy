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

import { describe, expect, test } from 'vitest';

import { buildSections, fillQuery } from './searchSections.js';

const doc = (id, category) => ({ id, category, title: id });
const results = [
  ...Array.from({ length: 14 }, (_, i) => doc(`d${i}`, 'Documents')),
  ...Array.from({ length: 3 }, (_, i) => doc(`c${i}`, 'Controls')),
];
const mapping = {};

describe('buildSections', () => {
  test('a group limit shows that many rows with the full count', () => {
    const groups = [
      {
        label: 'Documents',
        match: { category: 'Documents' },
        limit: 3,
        seeAll: { pageId: 'docs' },
      },
      { label: 'Controls', match: { category: 'Controls' }, limit: 5 },
    ];
    const sections = buildSections({ results, groups, resultMapping: mapping, maxResults: 2 });
    expect(sections.map((s) => [s.label, s.items.length, s.total])).toEqual([
      ['Documents', 3, 14],
      ['Controls', 3, 3],
    ]);
  });

  test('maxResults caps the list when no group sets a limit', () => {
    const groups = [{ label: 'Documents', match: { category: 'Documents' } }];
    const sections = buildSections({ results, groups, resultMapping: mapping, maxResults: 5 });
    expect(sections[0].items).toHaveLength(5);
    expect(sections).toHaveLength(1);
  });

  test('a group with no match has no section', () => {
    const groups = [
      { label: 'People', match: { category: 'People' }, limit: 3 },
      { label: 'Controls', match: { category: 'Controls' }, limit: 3 },
    ];
    const sections = buildSections({ results, groups, resultMapping: mapping, maxResults: 20 });
    expect(sections.map((s) => s.label)).toEqual(['Controls', 'Other']);
  });

  test('without groups the list is one section capped by maxResults', () => {
    const sections = buildSections({ results, groups: [], resultMapping: mapping, maxResults: 4 });
    expect(sections).toHaveLength(1);
    expect(sections[0].items).toHaveLength(4);
  });
});

describe('fillQuery', () => {
  test('replaces {query} at any depth', () => {
    expect(fillQuery({ q: 'a {query}', list: ['{query}', 1] }, 'x')).toEqual({
      q: 'a x',
      list: ['x', 1],
    });
  });
});
