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

import getReadableRows from './getReadableRows.js';

const translate = (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key);

test('getReadableRows labels fields with humanised keys and reads values as a person does', () => {
  expect(
    getReadableRows({
      output: {
        dueDate: '2026-10-18T09:00:00Z',
        open_count: 1200,
        archived: false,
        url: 'https://x.test/a',
        owner: null,
      },
      translate,
    })
  ).toEqual([
    {
      depth: 0,
      kind: 'text',
      label: 'Due Date',
      text: new Date('2026-10-18T09:00:00Z').toLocaleString(),
    },
    { depth: 0, kind: 'text', label: 'Open count', text: (1200).toLocaleString() },
    { depth: 0, kind: 'text', label: 'Archived', text: 'No' },
    { depth: 0, kind: 'link', label: 'Url', text: 'https://x.test/a' },
    { depth: 0, kind: 'empty', label: 'Owner', text: '—' },
  ]);
});

test('getReadableRows nests objects and lists as groups and says when they are empty', () => {
  expect(
    getReadableRows({ output: { tasks: [{ key: 'ACME-1' }], tags: [], meta: {} }, translate })
  ).toEqual([
    { depth: 0, kind: 'group', label: 'Tasks' },
    { depth: 1, kind: 'group', label: '1' },
    { depth: 2, kind: 'text', label: 'Key', text: 'ACME-1' },
    { depth: 0, kind: 'empty', label: 'Tags', text: 'agent.toolResult.emptyList' },
    { depth: 0, kind: 'empty', label: 'Meta', text: 'agent.toolResult.empty' },
  ]);
});

test('getReadableRows keeps 20 entries a level and 3 levels', () => {
  const rows = getReadableRows({ output: Array.from({ length: 25 }, (_, i) => i), translate });
  expect(rows).toHaveLength(21);
  expect(rows[20]).toEqual({ depth: 0, kind: 'more', text: '+5' });
  const deep = getReadableRows({ output: { a: { b: { c: { d: { e: 1 } } } } }, translate });
  expect(deep[deep.length - 1]).toEqual({ depth: 3, kind: 'text', label: 'D', text: '{"e":1}' });
});

test('getReadableRows says a call with no output completed with no data', () => {
  expect(getReadableRows({ output: null, translate })).toEqual([
    { depth: 0, kind: 'empty', text: 'agent.toolResult.completedNoData' },
  ]);
});
