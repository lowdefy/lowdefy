/*
  Copyright 2021 Lowdefy, Inc

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

// Elements inside a cell that act on their own: cell buttons, links, menus, inputs, selectors,
// switches, ag-grid's selection checkbox, and HTML data-event elements.
const CONTROL_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'label',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[data-event]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '.ant-select',
].join(', ');

// A click on a control in a cell belongs to the control, not the row or cell. ag-grid fires
// rowClicked and cellClicked from its own DOM listeners, which run before React's, so the cell
// renderer's stopPropagation cannot keep the click out of onRowClick and onCellClick.
function isCellControlClick(agGridEvent) {
  const target = agGridEvent.event?.target;
  if (!(target instanceof Element)) return false;
  const cell = target.closest('.ag-cell');
  const control = target.closest(CONTROL_SELECTOR);
  return cell !== null && control !== null && cell.contains(control);
}

export default isCellControlClick;
