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

/**
 * @vitest-environment jsdom
 */

import journeyTargetSelectors from './journeyTargetSelectors.js';
import { expect, test } from 'vitest';

test('journeyTargetSelectors interactiveControl lists every control the journey runner clicks', () => {
  expect(journeyTargetSelectors.interactiveControl).toBe(
    [
      'button',
      '[role="button"]',
      'a[href]',
      'label:has(input[type="radio"])',
      'label:has(input[type="checkbox"])',
      'input:not([type="hidden"]):not(label input[type="radio"]):not(label input[type="checkbox"])',
      'textarea',
      'select',
      '[role="switch"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="tab"]',
      '[role="menuitem"]',
    ].join(', ')
  );
});

test('journeyTargetSelectors names the wrapper prefix, grid attributes, layers and options', () => {
  expect(journeyTargetSelectors).toMatchObject({
    blockWrapperPrefix: 'bl-',
    dropdownOption: '.ant-select-item-option, [role="option"]',
    layers: ['[role="menu"]', '[role="dialog"]'],
  });
});

test('gridSelector covers ag-grid and Table rows and cells, never their headers', () => {
  const { gridSelector } = journeyTargetSelectors;
  expect(gridSelector({ kind: 'row', value: 1 })).toBe(
    '.ag-row[row-index="1"], .lf-table-row[data-row-index="1"]'
  );
  expect(gridSelector({ kind: 'row' })).toBe(
    '.ag-row[row-index], .lf-table-row[data-row-index]:not([data-row-index="-1"])'
  );
  expect(gridSelector({ kind: 'cell', value: 'a"b' })).toBe(
    '.ag-cell[col-id="a\\"b"], .lf-table-gridcell[data-col-key="a\\"b"][role="gridcell"]'
  );
  expect(gridSelector({ kind: 'cell' })).toBe(
    '.ag-cell[col-id], .lf-table-gridcell[data-col-key][role="gridcell"]'
  );
});

test('gridSelector matches every row when the value is null', () => {
  expect(journeyTargetSelectors.gridSelector({ kind: 'row', value: null })).toBe(
    '.ag-row[row-index], .lf-table-row[data-row-index]:not([data-row-index="-1"])'
  );
});

test('portalClass names a block in a class safe for a CSS selector', () => {
  expect(journeyTargetSelectors.portalClass('unlink_modal')).toBe('ldf-portal-unlink_modal');
  expect(journeyTargetSelectors.portalClass('rows.0.edit')).toBe('ldf-portal-rows_0_edit');
});

test('gridSelector selects ag-grid and Table rows by key, never a header row', () => {
  const { gridSelector } = journeyTargetSelectors;
  expect(gridSelector({ kind: 'rowKey', value: 'inv-0042' })).toBe(
    '.ag-row[row-id="inv-0042"], .lf-table-row[data-row-key="inv-0042"]'
  );
  expect(gridSelector({ kind: 'rowKey' })).toBe('.ag-row[row-id], .lf-table-row[data-row-key]');
});

test('gridSelector by row key matches body rows and not the header rows in a page', () => {
  document.body.innerHTML = `
    <div class="ag-header-row" row-index="0"></div>
    <div class="ag-row" row-index="0" row-id="inv-0042"></div>
    <div class="lf-table-row" role="row" data-row-index="-1"></div>
    <div class="lf-table-row" role="row" data-row-index="0" data-row-key="inv-0042"></div>
  `;
  const { gridSelector } = journeyTargetSelectors;
  const byKey = document.querySelectorAll(gridSelector({ kind: 'rowKey', value: 'inv-0042' }));
  expect(Array.from(byKey).map((element) => element.className)).toEqual(['ag-row', 'lf-table-row']);
  const every = document.querySelectorAll(gridSelector({ kind: 'rowKey' }));
  expect(every).toHaveLength(2);
});

test('controlSelector names the block, the control and the row key, quoted', () => {
  const { controlSelector } = journeyTargetSelectors;
  expect(controlSelector({ blockId: 'deleteModal', control: 'ok' })).toBe(
    '[data-lf-block="deleteModal"][data-lf-control="ok"]'
  );
  expect(controlSelector({ blockId: 'invoices', control: 'void', rowKey: 'inv-0042' })).toBe(
    '[data-lf-block="invoices"][data-lf-control="void"][data-lf-row-key="inv-0042"]'
  );
  expect(controlSelector({ blockId: 'a"b', control: 'c\\d', rowKey: 'e"f' })).toBe(
    '[data-lf-block="a\\"b"][data-lf-control="c\\\\d"][data-lf-row-key="e\\"f"]'
  );
});

test('controlSelector finds a marked control by a key with quotes and backslashes', () => {
  document.body.innerHTML = `
    <button data-lf-block='a"b' data-lf-control="c\\d">x</button>
    <button data-lf-block='a"b' data-lf-control="other">y</button>
  `;
  const selector = journeyTargetSelectors.controlSelector({ blockId: 'a"b', control: 'c\\d' });
  expect(document.querySelectorAll(selector)).toHaveLength(1);
  expect(document.querySelector(selector).textContent).toBe('x');
});

test('controlAttributes name the marks a control carries', () => {
  expect(journeyTargetSelectors.controlAttributes).toEqual({
    blockId: 'data-lf-block',
    control: 'data-lf-control',
    rowKey: 'data-lf-row-key',
  });
});

test('isGeneratedRowKey tells a generated row key from a row key the data gives', () => {
  const { isGeneratedRowKey } = journeyTargetSelectors;
  expect(isGeneratedRowKey('__row_3')).toBe(true);
  expect(isGeneratedRowKey('inv-0042')).toBe(false);
  expect(isGeneratedRowKey(42)).toBe(false);
  expect(isGeneratedRowKey('row___row_3')).toBe(false);
});

test('dropdownTrigger names antd dropdown triggers and Table cell menu buttons', () => {
  expect(journeyTargetSelectors.dropdownTrigger).toBe(
    '.ant-dropdown-trigger, .lf-table-menu-trigger'
  );
});

test('controlMarks are the attributes controlSelector finds', () => {
  const { controlMarks, controlSelector } = journeyTargetSelectors;
  const marks = controlMarks({ blockId: 'invoices', control: 'void', rowKey: 42 });
  expect(marks).toEqual({
    'data-lf-block': 'invoices',
    'data-lf-control': 'void',
    'data-lf-row-key': '42',
  });
  const button = document.createElement('button');
  Object.entries(marks).forEach(([name, value]) => button.setAttribute(name, value));
  document.body.replaceChildren(button);
  expect(
    document.querySelector(controlSelector({ blockId: 'invoices', control: 'void', rowKey: '42' }))
  ).toBe(button);
});

test('controlMarks leave out the row key outside a grid and mark nothing without a block', () => {
  const { controlMarks } = journeyTargetSelectors;
  expect(controlMarks({ blockId: 'deleteModal', control: 'ok' })).toEqual({
    'data-lf-block': 'deleteModal',
    'data-lf-control': 'ok',
  });
  expect(controlMarks({ blockId: 'deleteModal', control: 'ok', rowKey: null })).toEqual({
    'data-lf-block': 'deleteModal',
    'data-lf-control': 'ok',
  });
  expect(controlMarks({ control: 'ok' })).toEqual({});
});
