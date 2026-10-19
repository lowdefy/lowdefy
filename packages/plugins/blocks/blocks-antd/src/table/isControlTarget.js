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

// Elements in a cell that act on their own. A click on one belongs to the
// control, never to the row or cell underneath it.
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
  '.ant-dropdown',
].join(', ');

// Whether a DOM event target is, or sits inside, a control within `container`
// (the row). Targets outside the container, such as a dropdown rendered in a
// portal whose React events still bubble through the row, count as controls.
function isControlTarget({ target, container }) {
  if (!(target instanceof Element)) return false;
  if (!container.contains(target)) return true;
  const control = target.closest(CONTROL_SELECTOR);
  return control !== null && container.contains(control);
}

export default isControlTarget;
