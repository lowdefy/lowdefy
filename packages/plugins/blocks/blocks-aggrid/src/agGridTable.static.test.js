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

import { agGridTable } from './agGridTable.static.js';

// Call the renderer with a `propertiesEval.output`-shaped block projection.
function run({ properties = {}, context = {} } = {}) {
  return agGridTable.toReport({
    block: { id: 'b', blockId: 'grid_1', type: 'AgGridAlpine', properties },
    layout: { width: 515, fraction: 1 },
    context,
  });
}

describe('agGridTable', () => {
  test('emits a grid node — worksheet data, not document content', () => {
    const result = run({
      properties: { columnDefs: [{ field: 'name' }], rowData: [{ name: 'Ada' }] },
    });
    expect(result.kind).toBe('grid');
  });

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

  test('defaultColDef is merged under every column like the grid does', () => {
    const result = run({
      properties: {
        defaultColDef: { valueFormatter: ({ value }) => `#${value}`, hide: false },
        columnDefs: [{ field: 'a' }, { field: 'b', valueFormatter: ({ value }) => `${value}!` }],
        rowData: [{ a: 1, b: 2 }],
      },
    });
    expect(result.rows).toEqual([
      [
        { value: 1, formatted: '#1' },
        { value: 2, formatted: '2!' },
      ],
    ]);
  });

  test('a defaultColDef hide is overridden by the column', () => {
    const result = run({
      properties: {
        defaultColDef: { hide: true },
        columnDefs: [{ field: 'a', hide: false }, { field: 'b' }],
        rowData: [{ a: 1, b: 2 }],
      },
    });
    expect(result.header).toEqual([{ value: 'a' }]);
  });

  test('column groups are flattened to their visible leaf columns in order', () => {
    const result = run({
      properties: {
        columnDefs: [
          { field: 'id' },
          {
            headerName: 'Address',
            children: [
              { field: 'city' },
              { field: 'zip', hide: true },
              { headerName: 'Deep', children: [{ field: 'country', headerName: 'Country' }] },
            ],
          },
        ],
        rowData: [{ id: 1, city: 'London', zip: 'N1', country: 'UK' }],
      },
    });
    expect(result.header).toEqual([{ value: 'id' }, { value: 'city' }, { value: 'Country' }]);
    expect(result.rows).toEqual([[{ value: 1 }, { value: 'London' }, { value: 'UK' }]]);
  });

  test('object and array row values are serialised so no object reaches a cell', () => {
    const result = run({
      properties: {
        columnDefs: [{ field: 'meta' }, { field: 'tags' }],
        rowData: [{ meta: { formula: 'HYPERLINK("x")' }, tags: ['a', 'b'] }],
      },
    });
    expect(result.rows).toEqual([
      [{ value: '{"formula":"HYPERLINK(\\"x\\")"}' }, { value: '["a","b"]' }],
    ]);
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
