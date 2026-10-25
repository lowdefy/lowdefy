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
// the Table header row's index is -1, which is no journey row. A row keyed by pinned position
// (ag-grid `t-0`) is no journey row either.
const gridRules = [
  {
    cellAttribute: 'col-id',
    cellClass: 'ag-cell',
    rowAttribute: 'row-index',
    rowClass: 'ag-row',
  },
  {
    cellAttribute: 'data-col-key',
    cellClass: 'lf-table-gridcell',
    rowAttribute: 'data-row-index',
    rowClass: 'lf-table-row',
  },
];

function quoted(value) {
  return `"${String(value).replace(/["\\]/g, '\\$&')}"`;
}

// The selector for a row of any grid: with a value, the row at that displayed index; without,
// every row.
function rowSelector(value) {
  return gridRules
    .map(({ rowAttribute, rowClass }) =>
      value === undefined
        ? `.${rowClass}[${rowAttribute}]`
        : `.${rowClass}[${rowAttribute}=${quoted(value)}]`
    )
    .join(', ');
}

// The selector for a cell of any grid: with a value, the cell of that column; without, every cell.
function cellSelector(value) {
  return gridRules
    .map(({ cellAttribute, cellClass }) =>
      value === undefined
        ? `.${cellClass}[${cellAttribute}]`
        : `.${cellClass}[${cellAttribute}=${quoted(value)}]`
    )
    .join(', ');
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
  cellSelector,
  checkboxOption,
  // The options of a dropdown, the elements a `select` step clicks.
  dropdownOption: '.ant-select-item-option, [role="option"]',
  gridRules,
  interactiveControl: interactiveControlRules.map(selectorOf).join(', '),
  interactiveControlRules,
  interactiveRoles,
  // Portal layers, front-most first: an open dropdown menu covers a dialog, a dialog covers the
  // page.
  layers: ['[role="menu"]', '[role="dialog"]'],
  portalClass,
  radioOption,
  rowSelector,
};

export default journeyTargetSelectors;
