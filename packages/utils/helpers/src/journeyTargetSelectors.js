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

const journeyTargetSelectors = {
  // Every block renders a wrapper with id `bl-<blockId>`.
  blockWrapperPrefix: 'bl-',
  // ag-grid's displayed row index and a cell's column id.
  cellAttribute: 'col-id',
  checkboxOption,
  // The options of a dropdown, the elements a `select` step clicks.
  dropdownOption: '.ant-select-item-option, [role="option"]',
  interactiveControl: interactiveControlRules.map(selectorOf).join(', '),
  interactiveControlRules,
  interactiveRoles,
  // Portal layers, front-most first: an open dropdown menu covers a dialog, a dialog covers the
  // page.
  layers: ['[role="menu"]', '[role="dialog"]'],
  radioOption,
  rowAttribute: 'row-index',
};

export default journeyTargetSelectors;
