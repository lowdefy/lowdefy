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

import { validateNode } from '../../../../../reports/src/ir/nodes.js';
import { agGridTable } from './agGridTable.js';

// Call the renderer with a `propertiesEval.output`-shaped block projection and
// validate the returned node against the closed IR validator.
function run({ properties = {}, context = {} } = {}) {
  const result = agGridTable.toReport({
    block: { id: 'b', blockId: 'grid_1', type: 'AgGridAlpine', properties },
    context,
  });
  if (result != null) validateNode(result);
  return result;
}

describe('agGridTable', () => {
  test('maps columnDefs to a header row and rowData to cell rows', () => {
    const result = run({
      properties: {
        columnDefs: [{ field: 'name', headerName: 'Name' }, { field: 'age' }],
        rowData: [
          { name: 'Ada', age: 36 },
          { name: 'Alan', age: 41 },
        ],
      },
    });
    // headerName else field.
    expect(result.header).toEqual([{ value: 'Name' }, { value: 'age' }]);
    expect(result.rows).toEqual([
      [{ value: 'Ada' }, { value: 36 }],
      [{ value: 'Alan' }, { value: 41 }],
    ]);
  });

  test('resolves dot-path fields from the row', () => {
    const result = run({
      properties: {
        columnDefs: [{ field: 'address.city', headerName: 'City' }],
        rowData: [{ address: { city: 'London' } }, { address: {} }],
      },
    });
    expect(result.rows).toEqual([[{ value: 'London' }], [{ value: undefined }]]);
  });

  test('a formatter output lands in formatted while value stays typed', () => {
    const result = run({
      properties: {
        columnDefs: [
          {
            field: 'price',
            headerName: 'Price',
            valueFormatter: ({ value }) => `$${value.toFixed(2)}`,
          },
        ],
        rowData: [{ price: 9.5 }],
      },
    });
    const [[priceCell]] = result.rows;
    expect(priceCell).toEqual({ value: 9.5, formatted: '$9.50' });
    expect(typeof priceCell.value).toBe('number');
  });

  test('the formatter receives ag-grid-shaped params', () => {
    const seen = [];
    run({
      properties: {
        columnDefs: [
          {
            field: 'a',
            valueFormatter: (params) => {
              seen.push(params);
              return 'x';
            },
          },
        ],
        rowData: [{ a: 1, b: 2 }],
      },
    });
    expect(seen[0].value).toBe(1);
    expect(seen[0].data).toEqual({ a: 1, b: 2 });
    expect(seen[0].colDef.field).toBe('a');
  });

  test('a throwing formatter falls back to the raw value and logs a warning', () => {
    const calls = [];
    const warn = (...args) => calls.push(args);
    const result = run({
      context: { logger: { warn } },
      properties: {
        columnDefs: [
          {
            field: 'v',
            valueFormatter: () => {
              throw new Error('window is not defined');
            },
          },
        ],
        rowData: [{ v: 7 }],
      },
    });
    expect(result.rows).toEqual([[{ value: 7 }]]);
    expect(calls).toHaveLength(1);
    const [meta, message] = calls[0];
    expect(meta).toMatchObject({ blockId: 'grid_1', field: 'v' });
    expect(message).toContain('grid_1');
  });

  test('hidden columns are absent from header and rows', () => {
    const result = run({
      properties: {
        columnDefs: [{ field: 'name' }, { field: 'secret', hide: true }, { field: 'age' }],
        rowData: [{ name: 'Ada', secret: 'x', age: 36 }],
      },
    });
    expect(result.header).toEqual([{ value: 'name' }, { value: 'age' }]);
    expect(result.rows).toEqual([[{ value: 'Ada' }, { value: 36 }]]);
  });

  test('a valueGetter overrides the field lookup', () => {
    const result = run({
      properties: {
        columnDefs: [
          {
            headerName: 'Full name',
            valueGetter: ({ data }) => `${data.first} ${data.last}`,
          },
        ],
        rowData: [{ first: 'Ada', last: 'Lovelace' }],
      },
    });
    expect(result.rows).toEqual([[{ value: 'Ada Lovelace' }]]);
  });

  test('a valueGetter value is still passed through a valueFormatter', () => {
    const result = run({
      properties: {
        columnDefs: [
          {
            headerName: 'Total',
            valueGetter: ({ data }) => data.qty * data.price,
            valueFormatter: ({ value }) => `$${value}`,
          },
        ],
        rowData: [{ qty: 3, price: 4 }],
      },
    });
    expect(result.rows).toEqual([[{ value: 12, formatted: '$12' }]]);
  });

  test('returns null when there are no visible columns', () => {
    expect(run({ properties: { columnDefs: [], rowData: [{ a: 1 }] } })).toBeNull();
    expect(
      run({ properties: { columnDefs: [{ field: 'a', hide: true }], rowData: [{ a: 1 }] } })
    ).toBeNull();
  });

  test('a formatter returning null or undefined yields no formatted string', () => {
    const result = run({
      properties: {
        columnDefs: [{ field: 'a', valueFormatter: () => null }],
        rowData: [{ a: 5 }],
      },
    });
    expect(result.rows).toEqual([[{ value: 5 }]]);
  });
});
