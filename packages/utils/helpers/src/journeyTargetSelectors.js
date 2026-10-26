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

import type from './type.js';

// The rules a journey target is resolved by. The journey runner resolves targets with them, and
// the engine's describe functions read the same rules in reverse, so the two cannot drift apart.

// A radio or checkbox inside a <label> is reached through the label: the label carries the
// option's text and is what a person clicks, while the input may have no size at all (antd
// Segmented hides it at zero width and height).
const radioOptionRule = { selector: 'label', has: 'input[type="radio"]' };
const checkboxOptionRule = { selector: 'label', has: 'input[type="checkbox"]' };

function selectorOf({ selector, has, not = [] }) {
  const hasPart = has ? `:has(${has})` : '';
  return `${selector}${hasPart}${not.map((item) => `:not(${item})`).join('')}`;
}

const radioOption = selectorOf(radioOptionRule);
const checkboxOption = selectorOf(checkboxOptionRule);

// ARIA roles that make an element an interactive control.
const interactiveRoles = ['button', 'switch', 'checkbox', 'radio', 'tab', 'menuitem'];

// The controls a click target resolves to. Each rule is a simple selector, a descendant it must
// have and selectors it must not match, so the rules serve both as one selector string
// (Playwright, browsers) and as a matcher (isInteractiveControl) for DOMs whose selector engine
// gets :has() and complex :not() wrong, such as jsdom.
const interactiveControlRules = [
  { selector: 'button' },
  { selector: '[role="button"]' },
  { selector: 'a[href]' },
  radioOptionRule,
  checkboxOptionRule,
  {
    selector: 'input:not([type="hidden"])',
    not: ['label input[type="radio"]', 'label input[type="checkbox"]'],
  },
  { selector: 'textarea' },
  { selector: 'select' },
  ...interactiveRoles
    .filter((role) => role !== 'button')
    .map((role) => ({ selector: `[role="${role}"]` })),
];

// The grids a journey target's `row` and `column` reach, as a displayed row and a cell inside it.
// A row's attribute holds its zero-based displayed index and a cell's holds the column key.
// Header rows and header cells are not matched: ag-grid's header cells are `.ag-header-cell`, and
// the Table header row carries the index `header` (-1), which is no journey row. A Table header
// cell carries the same class and column key as a body cell, so a Table cell must also be a
// `gridcell` (header cells are `columnheader`). A row keyed by pinned position (ag-grid `t-0`) is
// no journey row either.
const gridRules = [
  {
    row: { attribute: 'row-index', className: 'ag-row' },
    cell: { attribute: 'col-id', className: 'ag-cell' },
  },
  {
    row: { attribute: 'data-row-index', className: 'lf-table-row', header: '-1' },
    cell: { attribute: 'data-col-key', className: 'lf-table-gridcell', role: 'gridcell' },
  },
];

function quoted(value) {
  return `"${String(value).replace(/["\\]/g, '\\$&')}"`;
}

// The selector for one grid's row or cell (a part of a rule): with a value, the row at that
// displayed index or the cell of that column; without, every row or cell but a header.
function gridPartSelector({ part, value }) {
  const role = type.isNone(part.role) ? '' : `[role="${part.role}"]`;
  if (!type.isNone(value)) {
    return `.${part.className}[${part.attribute}=${quoted(value)}]${role}`;
  }
  const header = type.isNone(part.header) ? '' : `:not([${part.attribute}="${part.header}"])`;
  return `.${part.className}[${part.attribute}]${role}${header}`;
}

// The selector for a row (kind `row`) or a cell (kind `cell`) of any grid.
function gridSelector({ kind, value }) {
  return gridRules.map((rule) => gridPartSelector({ part: rule[kind], value })).join(', ');
}

// A block that renders into a portal (Modal, Drawer) puts this class on the portal's root, so a
// journey target scoped to the block reaches the portal content, which is outside the block's
// #bl- wrapper. The class is a CSS selector-safe form of the block id.
function portalClass(blockId) {
  return `ldf-portal-${String(blockId).replace(/[^\w-]/g, '_')}`;
}

const journeyTargetSelectors = {
  // Every block renders a wrapper with id `bl-<blockId>`.
  blockWrapperPrefix: 'bl-',
  checkboxOption,
  // The options of a dropdown, the elements a `select` step clicks.
  dropdownOption: '.ant-select-item-option, [role="option"]',
  gridPartSelector,
  gridRules,
  gridSelector,
  interactiveControl: interactiveControlRules.map(selectorOf).join(', '),
  interactiveControlRules,
  interactiveRoles,
  // Portal layers, front-most first: an open dropdown menu covers a dialog, a dialog covers the
  // page.
  layers: ['[role="menu"]', '[role="dialog"]'],
  portalClass,
  radioOption,
};

export default journeyTargetSelectors;
