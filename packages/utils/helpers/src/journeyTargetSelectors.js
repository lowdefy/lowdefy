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
const radioOption = 'label:has(input[type="radio"])';
const checkboxOption = 'label:has(input[type="checkbox"])';

// ARIA roles that make an element an interactive control.
const interactiveRoles = ['button', 'switch', 'checkbox', 'radio', 'tab', 'menuitem'];

const journeyTargetSelectors = {
  // Every block renders a wrapper with id `bl-<blockId>`.
  blockWrapperPrefix: 'bl-',
  // ag-grid's displayed row index and a cell's column id.
  cellAttribute: 'col-id',
  checkboxOption,
  // The options of a dropdown, the elements a `select` step clicks.
  dropdownOption: '.ant-select-item-option, [role="option"]',
  interactiveControl: [
    'button',
    '[role="button"]',
    'a[href]',
    radioOption,
    checkboxOption,
    'input:not([type="hidden"]):not(label input[type="radio"]):not(label input[type="checkbox"])',
    'textarea',
    'select',
    ...interactiveRoles.filter((role) => role !== 'button').map((role) => `[role="${role}"]`),
  ].join(', '),
  interactiveRoles,
  // Portal layers, front-most first: an open dropdown menu covers a dialog, a dialog covers the
  // page.
  layers: ['[role="menu"]', '[role="dialog"]'],
  radioOption,
  rowAttribute: 'row-index',
};

export default journeyTargetSelectors;
