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

import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import getRunSelection from './getRunSelection.js';
import normalizeEnrichment from './normalizeEnrichment.js';

const { columns } = normalizeColumns({
  columns: [
    'domain',
    { key: 'email', kind: 'enrichment', provider: 'findEmail' },
    { key: 'pitch', kind: 'ai', prompt: 'x' },
    { key: 'raw', kind: 'extract', source: 'email' },
  ],
});

test('normalizeEnrichment defaults to no add column, row or import', () => {
  const config = normalizeEnrichment({ properties: {}, columns });
  expect(config).toMatchObject({
    providers: [],
    addColumn: null,
    addRow: false,
    addRowText: null,
    importCsv: false,
  });
  expect(config.runColumns.map((column) => column.key)).toEqual(['email', 'pitch']);
  expect([...config.detailColumns]).toEqual(['email', 'pitch', 'raw']);
});

test('normalizeEnrichment takes every kind for addColumn true, or the listed ones', () => {
  expect(normalizeEnrichment({ properties: { addColumn: true }, columns }).addColumn).toEqual({
    kinds: ['input', 'formula', 'enrichment', 'ai', 'extract'],
  });
  expect(
    normalizeEnrichment({ properties: { addColumn: { kinds: ['input', 'ai'] } }, columns })
      .addColumn
  ).toEqual({ kinds: ['input', 'ai'] });
  expect(() =>
    normalizeEnrichment({ properties: { addColumn: { kinds: ['magic'] } }, columns })
  ).toThrow('Table "addColumn.kinds" must list column kinds from');
});

test('normalizeEnrichment validates providers and the columns that use them', () => {
  const providers = [
    { id: 'findEmail', title: 'Find email', inputs: [{ key: 'domain', required: true }] },
  ];
  const config = normalizeEnrichment({ properties: { providers }, columns });
  expect(config.providers[0]).toEqual({
    id: 'findEmail',
    title: 'Find email',
    description: null,
    icon: null,
    cost: null,
    inputs: [{ key: 'domain', required: true }],
    outputs: [],
  });
  expect(config.providersById.get('findEmail').title).toBe('Find email');
  expect(() =>
    normalizeEnrichment({ properties: { providers: [{ id: 'other' }] }, columns })
  ).toThrow('Table column "email" uses provider "findEmail", which is not in "providers".');
  expect(() =>
    normalizeEnrichment({ properties: { providers: [{ id: 'a' }, { id: 'a' }] }, columns: [] })
  ).toThrow('Duplicate Table provider id "a".');
  expect(() =>
    normalizeEnrichment({ properties: { providers: [{ title: 'x' }] }, columns: [] })
  ).toThrow('Table provider requires an "id" string.');
  expect(() =>
    normalizeEnrichment({ properties: { providers: [{ id: 'a', inputs: ['x'] }] }, columns: [] })
  ).toThrow('Table provider "a" "inputs" must be a list of objects with a "key" string.');
});

test('getRunSelection is the selection value when rows are selected', () => {
  const api = { getValue: () => ({ selected: [1, 2], view: { filter: null, search: null } }) };
  expect(getRunSelection({ api })).toEqual([1, 2]);
  const all = { all: true, except: [3], filter: { key: 'a', op: 'eq', value: 1 }, search: 'x' };
  expect(getRunSelection({ api: { getValue: () => ({ selected: all, view: {} }) } })).toBe(all);
});

test('getRunSelection is every row of the view when nothing is selected', () => {
  const filter = { key: 'stage', op: 'eq', value: 'won' };
  const api = { getValue: () => ({ selected: [], view: { filter, search: 'acme' } }) };
  expect(getRunSelection({ api })).toEqual({ all: true, except: [], filter, search: 'acme' });
  expect(getRunSelection({ api: { getValue: () => ({ view: {} }) } })).toEqual({
    all: true,
    except: [],
    filter: null,
    search: null,
  });
});
