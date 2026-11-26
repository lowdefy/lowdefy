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

import { renderToStaticMarkup } from 'react-dom/server';

import processColDefs from './processColDefs.js';
import { expect, test } from 'vitest';

// AG Grid resolves a string cellRenderer to a registered component, such as
// agAnimateShowChangeCellRenderer, so it must reach the colDef unchanged.
test('processColDefs keeps a named cellRenderer', () => {
  const [colDef] = processColDefs([
    { field: 'price', cellRenderer: 'agAnimateShowChangeCellRenderer' },
  ]);
  expect(colDef.cellRenderer).toBe('agAnimateShowChangeCellRenderer');
});

test('processColDefs keeps a named cellRenderer when ellipsis is set', () => {
  const [colDef] = processColDefs([
    { field: 'price', cellRenderer: 'agAnimateShowChangeCellRenderer', ellipsis: 2 },
  ]);
  expect(colDef.cellRenderer).toBe('agAnimateShowChangeCellRenderer');
  expect(colDef.cellClass).toBe('lf-ellipsis-2');
  expect(colDef.ellipsis).toBeUndefined();
});

// The cell renderers mark their controls with the grid's block id for journeys.
test('processColDefs passes the grid block id to a cell renderer', () => {
  const [colDef] = processColDefs(
    [{ field: 'active', cell: { type: 'switch', eventName: 'onToggle' } }],
    { blockId: 'invoices', methods: {}, components: {} }
  );
  const element = colDef.cellRenderer({ value: true, data: { active: true }, node: { id: 'r1' } });
  const html = renderToStaticMarkup(element);
  expect(html).toContain('data-lf-block="invoices"');
  expect(html).toContain('data-lf-control="onToggle"');
  expect(html).toContain('data-lf-row-key="r1"');
});
