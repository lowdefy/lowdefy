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

import needsTemplates from './needsTemplates.js';

test('needsTemplates is false for columns without templates', () => {
  expect(
    needsTemplates({
      columns: [
        { key: 'name', type: 'text', cell: {} },
        { key: 'note', type: 'text', cell: {}, tooltip: { field: 'note' } },
        { key: 'raw', type: 'html', cell: {} },
      ],
    })
  ).toBe(false);
});

test('needsTemplates is true for an html cell template', () => {
  expect(
    needsTemplates({
      columns: [{ key: 'bio', type: 'html', cell: { template: '<b>{{ value }}</b>' } }],
    })
  ).toBe(true);
});

test('needsTemplates is true for a tooltip template, as a string or { template }', () => {
  expect(needsTemplates({ columns: [{ key: 'a', cell: {}, tooltip: '{{ value }}' }] })).toBe(true);
  expect(
    needsTemplates({ columns: [{ key: 'a', cell: {}, tooltip: { template: '{{ value }}' } }] })
  ).toBe(true);
});

test('needsTemplates is true for an expandable row template', () => {
  expect(needsTemplates({ columns: [], expandable: { template: '<p>{{ row.name }}</p>' } })).toBe(
    true
  );
});
