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

import targetFromElementsChain from './targetFromElementsChain.js';
import { expect, test } from 'vitest';

const EMPTY = {
  block_id: null,
  row: null,
  row_key: null,
  column: null,
  control: null,
  text: null,
  option: false,
  block_ids: [],
};

function escape(value) {
  return String(value).replace(/"|\\"/g, '\\"');
}

// One chain entry as posthog-js writes it: `tag.classes:` then the attributes sorted by key.
function entry(tag, { classes = [], attributes = {}, text } = {}) {
  const all = { 'nth-child': 1, 'nth-of-type': 1, ...attributes };
  if (classes.length > 0) {
    all.attr__class = classes.join(' ');
  }
  if (attributes.attr__id) {
    all.attr_id = attributes.attr__id;
  }
  if (text) {
    all.text = text;
  }
  const pairs = Object.keys(all)
    .sort()
    .map((key) => `${escape(key)}="${escape(all[key])}"`)
    .join('');
  return `${[tag, ...[...classes].sort()].join('.')}:${pairs}`;
}

function wrapper(blockId) {
  return entry('div', { attributes: { attr__id: `bl-${blockId}` } });
}

function chain(...entries) {
  return entries.join(';');
}

test('targetFromElementsChain returns an empty target for an empty string', () => {
  expect(targetFromElementsChain('')).toEqual(EMPTY);
});

test('targetFromElementsChain returns an empty target for a value that is not a string', () => {
  expect(targetFromElementsChain(undefined)).toEqual(EMPTY);
  expect(targetFromElementsChain(null)).toEqual(EMPTY);
  expect(targetFromElementsChain(42)).toEqual(EMPTY);
});

test('targetFromElementsChain reads a button inside a block', () => {
  const value = chain(
    entry('span', { text: 'Save' }),
    entry('button', { classes: ['ant-btn', 'ant-btn-primary'], text: 'Save' }),
    wrapper('save_button'),
    wrapper('page')
  );
  expect(targetFromElementsChain(value)).toEqual({
    block_id: 'save_button',
    row: null,
    row_key: null,
    column: null,
    control: null,
    text: 'Save',
    option: false,
    block_ids: ['save_button', 'page'],
  });
});

test('targetFromElementsChain gives nested wrappers innermost first', () => {
  const value = chain(entry('h4', { text: 'Title' }), wrapper('title'), wrapper('card'));
  expect(targetFromElementsChain(value)).toEqual({
    ...EMPTY,
    block_id: 'title',
    block_ids: ['title', 'card'],
  });
});

test('targetFromElementsChain returns null ids for a chain with no block wrapper', () => {
  const value = chain(entry('button', { text: 'OK' }), entry('div', { classes: ['ant-modal'] }));
  expect(targetFromElementsChain(value)).toEqual({ ...EMPTY, text: 'OK' });
});

test('targetFromElementsChain ignores area wrappers, input ids and bare block ids', () => {
  const value = chain(
    entry('input', { attributes: { attr__id: 'name_input', attr__type: 'text' } }),
    entry('div', { attributes: { attr__id: 'name' } }),
    entry('div', { attributes: { attr__id: 'ar-card-content' } }),
    wrapper('name')
  );
  expect(targetFromElementsChain(value)).toMatchObject({ block_id: 'name', block_ids: ['name'] });
});

test('targetFromElementsChain keeps a list-indexed block id whole', () => {
  const value = chain(
    entry('button', { text: 'Review' }),
    wrapper('groups.2.rows.0.review_button')
  );
  expect(targetFromElementsChain(value).block_id).toBe('groups.2.rows.0.review_button');
});

test('targetFromElementsChain reads the grid row and column inside the block', () => {
  const value = chain(
    entry('button', { text: 'Edit' }),
    entry('div', { classes: ['ag-cell'], attributes: { 'attr__col-id': 'actions' } }),
    entry('div', { classes: ['ag-row'], attributes: { 'attr__row-index': '3' } }),
    wrapper('grid')
  );
  expect(targetFromElementsChain(value)).toMatchObject({
    block_id: 'grid',
    row: 3,
    column: 'actions',
    text: 'Edit',
  });
});

test('targetFromElementsChain gives a pinned grid row as null', () => {
  const value = chain(
    entry('div', { classes: ['ag-cell'], attributes: { 'attr__col-id': 'total' } }),
    entry('div', { classes: ['ag-row'], attributes: { 'attr__row-index': 't-0' } }),
    wrapper('grid')
  );
  expect(targetFromElementsChain(value)).toMatchObject({ row: null, column: 'total' });
});

test('targetFromElementsChain marks a dropdown option and keeps its block', () => {
  const value = chain(
    entry('div', { classes: ['ant-select-item-option-content'], text: 'Germany' }),
    entry('div', {
      classes: ['ant-select-item', 'ant-select-item-option'],
      attributes: { attr__role: 'option' },
    }),
    entry('div', { attributes: { attr__id: 'country_select_popup' } }),
    wrapper('country')
  );
  expect(targetFromElementsChain(value)).toEqual({
    ...EMPTY,
    block_id: 'country',
    text: 'Germany',
    option: true,
    block_ids: ['country'],
  });
});

test('targetFromElementsChain marks a role option without the antd class', () => {
  const value = chain(
    entry('li', { attributes: { attr__role: 'option' }, text: 'Red' }),
    wrapper('c')
  );
  expect(targetFromElementsChain(value).option).toBe(true);
});

test('targetFromElementsChain gives a text input no text', () => {
  const value = chain(
    entry('input', { classes: ['ant-input'], attributes: { attr__type: 'text' } }),
    wrapper('name')
  );
  expect(targetFromElementsChain(value).text).toBeNull();
});

test('targetFromElementsChain reads a label option by the text inside it', () => {
  const value = chain(
    entry('div', { classes: ['ant-segmented-item-label'], text: 'Monthly' }),
    entry('label', { classes: ['ant-segmented-item'] }),
    wrapper('period')
  );
  expect(targetFromElementsChain(value).text).toBe('Monthly');
});

test('targetFromElementsChain reaches a radio input through its label', () => {
  const value = chain(
    entry('input', { attributes: { attr__type: 'radio' } }),
    entry('span', { classes: ['ant-radio'] }),
    entry('label', { classes: ['ant-radio-wrapper'], text: 'Yes' }),
    wrapper('answer')
  );
  expect(targetFromElementsChain(value).text).toBe('Yes');
});

test('targetFromElementsChain prefers the control text over the clicked child text', () => {
  const value = chain(
    entry('span', { text: 'Save' }),
    entry('button', { text: 'Save draft' }),
    wrapper('save')
  );
  expect(targetFromElementsChain(value).text).toBe('Save draft');
});

test('targetFromElementsChain gives no text when the click reached no control', () => {
  const value = chain(entry('div', { text: 'Open order' }), wrapper('card'));
  expect(targetFromElementsChain(value).text).toBeNull();
});

test('targetFromElementsChain collapses whitespace in the control text', () => {
  const value = chain(entry('button', { text: '  Open  order\n12 ' }), wrapper('card'));
  expect(targetFromElementsChain(value).text).toBe('Open order 12');
});

test('targetFromElementsChain unescapes quotes and keeps semicolons inside values', () => {
  const value = chain(entry('button', { text: 'Say "hi"; then go' }), wrapper('greet'));
  expect(targetFromElementsChain(value)).toMatchObject({
    block_id: 'greet',
    text: 'Say "hi"; then go',
  });
});

test('targetFromElementsChain reads a class part that holds a colon', () => {
  const value = chain(entry('button', { classes: ['md:flex', 'px-2'], text: 'Go' }), wrapper('go'));
  expect(targetFromElementsChain(value)).toMatchObject({ block_id: 'go', text: 'Go' });
});

test('targetFromElementsChain does not throw on unbalanced quotes', () => {
  const value = 'button:nth-child="1"text="Sa;div:attr__id="bl-x';
  expect(() => targetFromElementsChain(value)).not.toThrow();
  expect(targetFromElementsChain(value)).toEqual(
    expect.objectContaining({ block_ids: expect.any(Array), option: false })
  );
});

test('targetFromElementsChain does not throw on malformed chains', () => {
  [
    ';;;',
    ':',
    'div',
    'div:attr__id',
    'div:attr__id=',
    'div:attr__id="',
    'div:attr__id="bl-a"garbage',
    '\\"\\"\\"',
    'div:text="\\',
  ].forEach((value) => {
    expect(() => targetFromElementsChain(value)).not.toThrow();
  });
  expect(targetFromElementsChain('div:attr__id="bl-a"garbage').block_id).toBe('a');
});

test('targetFromElementsChain reads a 1,000-entry chain', () => {
  const entries = Array.from({ length: 999 }, () => entry('div', { classes: ['inner'] }));
  const value = chain(...entries, wrapper('deep'));
  const start = Date.now();
  expect(targetFromElementsChain(value).block_ids).toEqual(['deep']);
  expect(Date.now() - start).toBeLessThan(1000);
});

// The chain of a click on a Modal's OK button in its portal: no block wrapper, the button marked
// with its block and key. The same case is a target fixture in @lowdefy/e2e-utils, which
// describeElement is tested against.
const modalOkChain = chain(
  entry('span', { text: 'OK' }),
  entry('button', {
    attributes: { 'attr__data-lf-block': 'delete_modal', 'attr__data-lf-control': 'ok' },
    text: 'OK',
  }),
  entry('div', { classes: ['ant-modal-footer'] }),
  entry('div', { classes: ['ant-modal'], attributes: { attr__role: 'dialog' } }),
  entry('div', { classes: ['ant-modal-root', 'ldf-portal-delete_modal'] })
);

test('targetFromElementsChain describes a marked Modal button in a portal as its control', () => {
  expect(targetFromElementsChain(modalOkChain)).toEqual({
    ...EMPTY,
    block_id: 'delete_modal',
    control: 'ok',
    block_ids: ['delete_modal'],
  });
});

test('targetFromElementsChain describes a marked menu item in a body popup as its control', () => {
  const value = chain(
    entry('span', { text: 'Archive' }),
    entry('li', {
      classes: ['ant-dropdown-menu-item'],
      attributes: {
        'attr__data-lf-block': 'actions',
        'attr__data-lf-control': 'archive',
        attr__role: 'menuitem',
      },
      text: 'Archive',
    }),
    entry('ul', { classes: ['ant-dropdown-menu'], attributes: { attr__role: 'menu' } }),
    entry('div', { classes: ['ant-dropdown'] })
  );
  expect(targetFromElementsChain(value)).toEqual({
    ...EMPTY,
    block_id: 'actions',
    control: 'archive',
    block_ids: ['actions'],
  });
});

function gridCellButtonChain(rowKey, rowIndex = '1') {
  return chain(
    entry('span', { text: 'Pay' }),
    entry('button', {
      attributes: {
        'attr__data-lf-block': 'invoices',
        'attr__data-lf-control': 'onPay',
        'attr__data-lf-row-key': rowKey,
      },
      text: 'Pay',
    }),
    entry('div', { classes: ['ag-cell'], attributes: { 'attr__col-id': 'actions' } }),
    entry('div', {
      classes: ['ag-row'],
      attributes: { 'attr__row-index': rowIndex, 'attr__row-id': rowKey },
    }),
    wrapper('invoices')
  );
}

test('targetFromElementsChain describes a marked AgGrid cell button by control and row key', () => {
  expect(targetFromElementsChain(gridCellButtonChain('inv-2'))).toEqual({
    ...EMPTY,
    block_id: 'invoices',
    row: 1,
    row_key: 'inv-2',
    column: 'actions',
    control: 'onPay',
    block_ids: ['invoices'],
  });
});

test('targetFromElementsChain describes a cell button in a generated-key row by row and text', () => {
  expect(targetFromElementsChain(gridCellButtonChain('__row_1'))).toEqual({
    ...EMPTY,
    block_id: 'invoices',
    row: 1,
    column: 'actions',
    text: 'Pay',
    block_ids: ['invoices'],
  });
});

test('targetFromElementsChain describes a cell button in a pinned row by text, with no row key', () => {
  expect(targetFromElementsChain(gridCellButtonChain('t-0', 't-0'))).toEqual({
    ...EMPTY,
    block_id: 'invoices',
    column: 'actions',
    text: 'Pay',
    block_ids: ['invoices'],
  });
});

test('targetFromElementsChain gives a Table row its key beside its index', () => {
  const value = chain(
    entry('div', {
      classes: ['lf-table-gridcell'],
      attributes: { 'attr__data-col-key': 'name', attr__role: 'gridcell' },
    }),
    entry('div', {
      classes: ['lf-table-row'],
      attributes: { 'attr__data-row-index': '0', 'attr__data-row-key': 'a1', attr__role: 'row' },
    }),
    wrapper('people')
  );
  expect(targetFromElementsChain(value)).toEqual({
    ...EMPTY,
    block_id: 'people',
    row: 0,
    row_key: 'a1',
    column: 'name',
    block_ids: ['people'],
  });
});

test('targetFromElementsChain gives no row key for a generated key or a pinned row', () => {
  const generated = chain(
    entry('div', {
      classes: ['lf-table-row'],
      attributes: { 'attr__data-row-index': '2', 'attr__data-row-key': '__row_2' },
    }),
    wrapper('people')
  );
  expect(targetFromElementsChain(generated)).toMatchObject({ row: 2, row_key: null });
  const pinned = chain(
    entry('div', {
      classes: ['ag-row'],
      attributes: { 'attr__row-index': 't-0', 'attr__row-id': 't-0' },
    }),
    wrapper('grid')
  );
  expect(targetFromElementsChain(pinned)).toMatchObject({ row: null, row_key: null });
});

test('targetFromElementsChain with rowKey false reads a marked control by its key, with no row key', () => {
  const { row_key: _rowKey, ...noRowKey } = EMPTY;
  expect(targetFromElementsChain(modalOkChain, { rowKey: false })).toEqual({
    ...noRowKey,
    block_id: 'delete_modal',
    control: 'ok',
    block_ids: ['delete_modal'],
  });
  expect(targetFromElementsChain(gridCellButtonChain('inv-2'), { rowKey: false })).toEqual({
    ...noRowKey,
    block_id: 'invoices',
    row: 1,
    column: 'actions',
    control: 'onPay',
    block_ids: ['invoices'],
  });
});

test('targetFromElementsChain with rowKey false still reads a generated-key cell button by its text', () => {
  const { row_key: _rowKey, ...noRowKey } = EMPTY;
  expect(targetFromElementsChain(gridCellButtonChain('__row_1'), { rowKey: false })).toEqual({
    ...noRowKey,
    block_id: 'invoices',
    row: 1,
    column: 'actions',
    text: 'Pay',
    block_ids: ['invoices'],
  });
});

test('targetFromElementsChain with rowKey false gives no row key for a keyed row', () => {
  const keyedRow = chain(
    entry('div', {
      classes: ['lf-table-row'],
      attributes: { 'attr__data-row-index': '0', 'attr__data-row-key': 'a1' },
    }),
    wrapper('people')
  );
  expect(targetFromElementsChain(keyedRow)).toMatchObject({ row: 0, row_key: 'a1' });
  expect(targetFromElementsChain(keyedRow, { rowKey: false })).not.toHaveProperty('row_key');
});
