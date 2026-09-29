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

import buildImportRows from './buildImportRows.js';
import chunkRows from './chunkRows.js';
import getInputColumns from './getInputColumns.js';
import matchCsvHeaders, { NEW_COLUMN, SKIP_COLUMN } from './matchCsvHeaders.js';

const { columns } = normalizeColumns({
  columns: [
    { key: 'name', title: 'Company name', kind: 'input' },
    { key: 'domain', field: 'web.domain' },
    { key: 'employees', type: 'number' },
    { key: 'active', type: 'boolean' },
    { key: 'email', kind: 'enrichment', provider: 'p' },
    { key: 'full', kind: 'formula', template: '{{ name }}' },
    { key: 'actions', type: 'buttons' },
  ],
});
const columnsByKey = new Map(columns.map((column) => [column.key, column]));

test('getInputColumns keeps input and plain data columns only', () => {
  expect(getInputColumns(columns).map((column) => column.key)).toEqual([
    'name',
    'domain',
    'employees',
    'active',
  ]);
});

test('matchCsvHeaders matches by key or title ignoring case and punctuation', () => {
  expect(
    matchCsvHeaders({
      headers: ['Company Name', 'DOMAIN', 'Employees', 'LinkedIn', ''],
      columns: getInputColumns(columns),
    })
  ).toEqual(['name', 'domain', 'employees', NEW_COLUMN, SKIP_COLUMN]);
});

test('matchCsvHeaders uses each column once', () => {
  expect(matchCsvHeaders({ headers: ['name', 'Name'], columns: getInputColumns(columns) })).toEqual(
    ['name', NEW_COLUMN]
  );
});

test('buildImportRows sets mapped fields, coerces types and adds new text columns', () => {
  const result = buildImportRows({
    records: [
      ['Acme', 'acme.com', '1,200', 'yes', 'in/acme', 'x'],
      ['Globex', '', 'many', 'no', '', 'y'],
    ],
    headers: ['Company', 'Domain', 'Employees', 'Active', 'LinkedIn URL', 'Ignore'],
    mapping: ['name', 'domain', 'employees', 'active', NEW_COLUMN, SKIP_COLUMN],
    columnsByKey,
    existingKeys: columns.map((column) => column.key),
  });
  expect(result.newColumns).toEqual([
    {
      key: 'linkedin_url',
      title: 'LinkedIn URL',
      type: 'text',
      kind: 'input',
      editable: true,
      userDefined: true,
    },
  ]);
  expect(result.rows).toEqual([
    {
      name: 'Acme',
      web: { domain: 'acme.com' },
      employees: 1200,
      active: true,
      linkedin_url: 'in/acme',
    },
    { name: 'Globex', employees: 'many', active: false },
  ]);
  expect(result.skipped).toBe(0);
});

test('buildImportRows drops records without a mapped value and keeps new keys unique', () => {
  const result = buildImportRows({
    records: [
      ['', 'x'],
      ['a', 'b'],
    ],
    headers: ['name', 'name'],
    mapping: [NEW_COLUMN, NEW_COLUMN],
    columnsByKey,
    existingKeys: ['name'],
  });
  expect(result.newColumns.map((column) => column.key)).toEqual(['name_2', 'name_3']);
  expect(result.rows).toEqual([{ name_3: 'x' }, { name_2: 'a', name_3: 'b' }]);
  const skipped = buildImportRows({
    records: [['', '']],
    headers: ['a', 'b'],
    mapping: ['name', SKIP_COLUMN],
    columnsByKey,
    existingKeys: [],
  });
  expect(skipped).toEqual({ rows: [], newColumns: [], skipped: 1 });
});

test('chunkRows splits rows into batches of the size, the last one shorter', () => {
  const rows = Array.from({ length: 1201 }, (_, index) => index);
  const batches = chunkRows({ rows, size: 500 });
  expect(batches.map((batch) => batch.length)).toEqual([500, 500, 201]);
  expect(batches[2][200]).toBe(1200);
  expect(chunkRows({ rows: [], size: 500 })).toEqual([]);
});
