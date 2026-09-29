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

import compileCondition from './compileCondition.js';
import normalizeColumns from './normalizeColumns.js';
import readColumnValue from './readColumnValue.js';

function leaf(columns, key) {
  return normalizeColumns({ columns }).columnsByKey[key];
}

test('a plain column has no kind and is not user defined', () => {
  const column = leaf(['name'], 'name');
  expect(column.kind).toBeUndefined();
  expect(column.userDefined).toBeUndefined();
  expect(column.stateField).toBeUndefined();
  expect(column.field).toBe('name');
});

test('a plain column can be user defined and have a status field', () => {
  const column = leaf([{ key: 'name', userDefined: true, status: { field: 'runs.name' } }], 'name');
  expect(column.userDefined).toBe(true);
  expect(column.stateField).toBe('runs.name');
});

test('an input column keeps its field and editable flag', () => {
  const column = leaf(
    [{ key: 'domain', kind: 'input', editable: true, userDefined: true }],
    'domain'
  );
  expect(column).toMatchObject({
    kind: 'input',
    field: 'domain',
    editable: true,
    userDefined: true,
  });
});

test('an enrichment column reads _enrich.<key>.value and its state from _enrich.<key>', () => {
  const column = leaf(
    [
      'domain',
      {
        key: 'email',
        kind: 'enrichment',
        provider: 'findEmail',
        inputs: { domain: { column: 'domain' }, limit: { value: 1 } },
        output: 'email',
        autoRun: true,
      },
    ],
    'email'
  );
  expect(column).toMatchObject({
    kind: 'enrichment',
    field: '_enrich.email.value',
    stateField: '_enrich.email',
    provider: 'findEmail',
    output: 'email',
    autoRun: true,
    editable: false,
  });
  expect(column.inputSources.map((source) => source.param)).toEqual(['domain', 'limit']);
});

test('an enrichment column keeps an explicit field and status field', () => {
  const column = leaf(
    [
      {
        key: 'email',
        kind: 'enrichment',
        provider: 'p',
        field: 'email',
        status: { field: 'runs.email' },
      },
    ],
    'email'
  );
  expect(column.field).toBe('email');
  expect(column.stateField).toBe('runs.email');
});

test('an ai column takes its type and options from output', () => {
  const column = leaf(
    [
      'company',
      {
        key: 'segment',
        kind: 'ai',
        prompt: 'Which segment is {{ company }} in?',
        inputs: { company: { column: 'company' } },
        output: { type: 'tag', options: ['smb', 'enterprise'] },
      },
    ],
    'segment'
  );
  expect(column).toMatchObject({
    kind: 'ai',
    type: 'tag',
    field: '_enrich.segment.value',
    stateField: '_enrich.segment',
    autoRun: false,
  });
  expect(column.options.map((option) => option.value)).toEqual(['smb', 'enterprise']);
  expect(column.inputSources.map((source) => source.param)).toEqual(['company']);
});

test('an explicit column type wins over the ai output type', () => {
  const column = leaf(
    [{ key: 'score', kind: 'ai', prompt: 'x', type: 'number', output: { type: 'text' } }],
    'score'
  );
  expect(column.type).toBe('number');
});

test('an extract column reads a path in its source column raw result', () => {
  const columns = [
    { key: 'person', kind: 'enrichment', provider: 'people' },
    { key: 'linkedin', kind: 'extract', source: 'person', path: 'profiles.0.url' },
    { key: 'raw', kind: 'extract', source: 'person' },
  ];
  expect(leaf(columns, 'linkedin').field).toBe('_enrich.person.raw.profiles.0.url');
  expect(leaf(columns, 'linkedin').extractPath).toBe('profiles.0.url');
  expect(leaf(columns, 'raw').field).toBe('_enrich.person.raw');
});

test('an extract column keeps the header group path of the leaf', () => {
  const { columnsByKey } = normalizeColumns({
    columns: [
      { key: 'person', kind: 'ai', prompt: 'x' },
      {
        title: 'Group',
        children: [{ key: 'city', kind: 'extract', source: 'person', path: 'city' }],
      },
    ],
  });
  expect(columnsByKey.city.path).toEqual(['Group']);
});

test('a formula column renders its template over the row as text', () => {
  const column = leaf(
    [
      'first',
      'last',
      { key: 'email', kind: 'enrichment', provider: 'p' },
      { key: 'full', kind: 'formula', template: '{{ first }} {{ last }} <{{ email }}>' },
    ],
    'full'
  );
  const row = { first: 'Ada', last: 'Lovelace', _enrich: { email: { value: 'ada@x.io' } } };
  expect(readColumnValue({ column, row })).toBe('Ada Lovelace <ada@x.io>');
});

test('a formula column decodes escaped values and caches per row object', () => {
  const column = leaf([{ key: 'label', kind: 'formula', template: '{{ name }} & co' }], 'label');
  const row = { name: 'Smith & Sons' };
  expect(column.read(row)).toBe('Smith & Sons & co');
  row.name = 'changed';
  expect(column.read(row)).toBe('Smith & Sons & co');
  expect(column.read({ name: 'Other' })).toBe('Other & co');
});

test('a formula column can reference another formula column', () => {
  const column = leaf(
    [
      { key: 'a', kind: 'formula', template: '{{ x }}!' },
      { key: 'b', kind: 'formula', template: '{{ a }}?' },
    ],
    'b'
  );
  expect(column.read({ x: 'hi' })).toBe('hi!?');
});

test('conditions on a formula column test its rendered value', () => {
  const { columnsByKey } = normalizeColumns({
    columns: [{ key: 'full', kind: 'formula', template: '{{ first }} {{ last }}' }],
  });
  const test = compileCondition({
    condition: { key: 'full', op: 'eq', value: 'Ada Lovelace' },
    columnsByKey,
  });
  expect(test({ first: 'Ada', last: 'Lovelace' })).toBe(true);
  expect(test({ first: 'Ada', last: 'King' })).toBe(false);
});

test.each([
  [{ key: 'a', kind: 'magic' }, 'Table column "a" has unknown kind "magic".'],
  [{ key: 'a', kind: 'formula' }, 'Table column "a" requires "template" (a string).'],
  [{ key: 'a', kind: 'enrichment' }, 'Table column "a" requires "provider" (a string).'],
  [{ key: 'a', kind: 'ai' }, 'Table column "a" requires "prompt" (a string).'],
  [{ key: 'a', kind: 'extract' }, 'Table column "a" requires "source" (a string).'],
  [{ key: 'a', prompt: 'x' }, 'Table column "a" has "prompt", which needs kind "ai".'],
  [{ key: 'a', kind: 'formula', template: 'x', autoRun: true }, 'needs kind "enrichment" or "ai"'],
  [{ key: 'a', kind: 'formula', template: 'x', editable: true }, 'so it cannot be editable'],
  [{ key: 'a', kind: 'enrichment', provider: 'p', inputs: [] }, '"inputs" must be an object'],
  [
    { key: 'a', kind: 'enrichment', provider: 'p', inputs: { d: { column: 'x', value: 1 } } },
    'input "d" must be { column: <column key>, required? } or { value: <literal> }',
  ],
  [
    { key: 'a', kind: 'enrichment', provider: 'p', inputs: { d: { column: 'x', required: 'no' } } },
    'input "d" must be',
  ],
  [
    { key: 'a', kind: 'enrichment', provider: 'p', autoRun: 'yes' },
    '"autoRun" must be true or false',
  ],
  [{ key: 'a', kind: 'ai', prompt: 'x', output: 'text' }, '"output" must be { type, options? }'],
  [{ key: 'a', kind: 'ai', prompt: 'x', output: { type: 'blob' } }, 'unknown output type "blob"'],
  [{ key: 'a', status: 'queued' }, '"status" must be { field: <path> }'],
  [{ key: 'a', userDefined: 'yes' }, '"userDefined" must be true or false'],
])('normalizeColumns rejects an invalid kind config %#', (column, message) => {
  expect(() => normalizeColumns({ columns: [column] })).toThrow(message);
});

test('normalizeColumns rejects an enrichment input naming an unknown column', () => {
  expect(() =>
    normalizeColumns({
      columns: [{ key: 'a', kind: 'enrichment', provider: 'p', inputs: { d: { column: 'nope' } } }],
    })
  ).toThrow('Table column "a" input "d" names unknown column "nope".');
});

test('normalizeColumns rejects an extract column whose source is not an enrichment or ai column', () => {
  expect(() =>
    normalizeColumns({
      columns: ['name', { key: 'x', kind: 'extract', source: 'name', path: 'a' }],
    })
  ).toThrow('Table column "x" extracts from "name", which is not an enrichment or ai column.');
});

test('normalizeColumns rejects formula columns that reference each other', () => {
  expect(() =>
    normalizeColumns({
      columns: [
        { key: 'a', kind: 'formula', template: '{{ b }}' },
        { key: 'b', kind: 'formula', template: '{{ a }}' },
      ],
    })
  ).toThrow('Table formula columns "a" -> "b" -> "a" reference each other.');
});

test('normalizeColumns rejects a formula template that does not compile', () => {
  expect(() =>
    normalizeColumns({ columns: [{ key: 'a', kind: 'formula', template: '{{ a ' }] })
  ).toThrow();
});
