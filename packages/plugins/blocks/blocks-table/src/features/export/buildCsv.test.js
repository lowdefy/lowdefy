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

import compileColumns from '@lowdefy/blocks-antd/table/compileColumns.js';
import normalizeColumns from '@lowdefy/blocks-antd/table/normalizeColumns.js';

import buildCsv from './buildCsv.js';
import createColumnAccessor from '../../core/createColumnAccessor.js';
import { expect, test } from 'vitest';

function createApi({ rows, summary = true, summaryRow }) {
  const normalized = normalizeColumns({
    columns: [
      { key: 'name', title: '<b>Name</b>' },
      { key: 'rate', type: 'percent', cell: { decimals: 0 } },
      { key: 'actions', type: 'buttons', cell: { buttons: [{ title: 'Open', eventName: 'x' }] } },
    ],
  });
  const columns = compileColumns({
    columns: normalized.columns,
    columnsByKey: normalized.columnsByKey,
    user: {},
  });
  return {
    config: { summary },
    dataRows: rows.map((original) => ({ original })),
    layout: {
      cols: [
        { key: '__select', special: true },
        ...columns.map((column) => ({
          key: column.key,
          column,
          accessor: createColumnAccessor(column),
        })),
      ],
    },
    properties: { summaryRow },
  };
}

const rows = [
  { id: 1, name: 'Ann', rate: 0.25 },
  { id: 2, name: 'Ben', rate: 0.5 },
];

test('buildCsv exports the header and data rows of the data columns', () => {
  const csv = buildCsv({ api: createApi({ rows }), formatted: false });
  expect(csv.split('\r\n')).toEqual(['Name,Rate', 'Ann,0.25', 'Ben,0.5']);
});

test('buildCsv ends with the summary row, formatted like the data rows', () => {
  const api = createApi({ rows, summaryRow: { name: 'Total', rate: 0.4 } });
  expect(buildCsv({ api, formatted: true }).split('\r\n')).toEqual([
    'Name,Rate',
    'Ann,25%',
    'Ben,50%',
    'Total,40%',
  ]);
  expect(buildCsv({ api, formatted: false }).split('\r\n').at(-1)).toBe('Total,0.4');
});

test('buildCsv leaves the summary row out when the summary footer is off', () => {
  const api = createApi({ rows, summary: false, summaryRow: { name: 'Total', rate: 0.4 } });
  expect(buildCsv({ api, formatted: false }).split('\r\n')).toEqual([
    'Name,Rate',
    'Ann,0.25',
    'Ben,0.5',
  ]);
});

test('buildCsv adds no line for a null summary row', () => {
  const api = createApi({ rows, summaryRow: null });
  expect(buildCsv({ api, formatted: false }).split('\r\n')).toHaveLength(3);
});
