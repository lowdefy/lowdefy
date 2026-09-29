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

import needsEnrichment from './needsEnrichment.js';

function needs(properties) {
  return needsEnrichment({ properties });
}

test('needsEnrichment is false for plain and formula columns', () => {
  expect(needs({ columns: ['name', { key: 'age', type: 'number' }] })).toBe(false);
  expect(needs({ columns: [{ key: 'full', kind: 'formula', template: '{{ a }} {{ b }}' }] })).toBe(
    false
  );
  expect(needs({ columns: [{ key: 'notes', kind: 'input' }], providers: [] })).toBe(false);
  expect(needs({ addColumn: false, addRow: false, importCsv: false })).toBe(false);
});

test('needsEnrichment is true for enrichment, ai, extract, status and user-defined columns', () => {
  expect(needs({ columns: [{ key: 'e', kind: 'enrichment', provider: 'p' }] })).toBe(true);
  expect(needs({ columns: [{ key: 'a', kind: 'ai', prompt: 'x' }] })).toBe(true);
  expect(needs({ columns: [{ key: 'x', kind: 'extract', source: 'e' }] })).toBe(true);
  expect(needs({ columns: [{ key: 's', status: { field: 'run' } }] })).toBe(true);
  expect(
    needs({ columns: [{ key: 'u', kind: 'formula', template: 'x', userDefined: true }] })
  ).toBe(true);
  expect(
    needs({ columns: [{ key: 'g', children: [{ key: 'a', kind: 'ai', prompt: 'x' }] }] })
  ).toBe(true);
});

test('needsEnrichment is true for providers, addColumn, addRow and importCsv', () => {
  expect(needs({ providers: [{ id: 'p' }] })).toBe(true);
  expect(needs({ addColumn: true })).toBe(true);
  expect(needs({ addColumn: { kinds: ['input'] } })).toBe(true);
  expect(needs({ addRow: true })).toBe(true);
  expect(needs({ importCsv: true })).toBe(true);
});
