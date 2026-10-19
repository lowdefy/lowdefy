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

import computeFallbackLayout from './computeFallbackLayout.js';
import needsTrailingColumn from '../features/enrichment/needsTrailingColumn.js';

const columns = [
  { key: 'name', width: 120 },
  { key: 'email', width: 160, pinned: 'end' },
];

test('computeFallbackLayout puts trailing columns last in the end region', () => {
  const layout = computeFallbackLayout({
    columns,
    defaultView: {},
    leadingColumns: [],
    trailingColumns: [{ key: '__lf_enrich', special: 'enrich', width: 44 }],
    value: null,
    viewportWidth: 800,
  });
  expect(layout.end.map((col) => col.key)).toEqual(['email', '__lf_enrich']);
  expect(layout.end[1]).toMatchObject({ region: 'end', width: 44 });
});

test('needsTrailingColumn follows addColumn, or onRowRun with an enrichment or ai column', () => {
  expect(needsTrailingColumn({ properties: { addColumn: true } })).toBe(true);
  expect(needsTrailingColumn({ properties: { addColumn: { kinds: ['ai'] } } })).toBe(true);
  const runnable = { columns: [{ key: 'a', kind: 'ai', prompt: 'x' }] };
  expect(needsTrailingColumn({ properties: runnable })).toBe(false);
  expect(needsTrailingColumn({ properties: runnable, events: { onRowRun: [] } })).toBe(true);
  expect(needsTrailingColumn({ properties: { columns: ['name'] }, events: { onRowRun: [] } })).toBe(
    false
  );
});
