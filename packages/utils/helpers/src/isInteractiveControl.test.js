/**
 * @jest-environment jsdom
 */
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

import findInteractiveControls from './findInteractiveControls.js';
import isInteractiveControl from './isInteractiveControl.js';

beforeEach(() => {
  document.body.innerHTML = `
    <div id="bl-form">
      <button id="save">Save</button>
      <div id="custom" role="button">Custom</div>
      <a id="link" href="/orders">Orders</a>
      <a id="anchor">No href</a>
      <label id="radio_label"><span><input id="radio" type="radio" /></span><span>Yes</span></label>
      <label id="checkbox_label"><input id="checkbox" type="checkbox" />Agree</label>
      <label id="plain_label">Name</label>
      <input id="text" type="text" />
      <input id="hidden" type="hidden" />
      <input id="bare_checkbox" type="checkbox" />
      <textarea id="notes"></textarea>
      <select id="choice"></select>
      <div id="switch" role="switch"></div>
      <div id="tab" role="tab">Tab</div>
      <div id="menuitem" role="menuitem">Item</div>
      <div id="plain">Text</div>
    </div>`;
});

test('isInteractiveControl matches the controls of the journey runner', () => {
  const ids = [
    'save',
    'custom',
    'link',
    'radio_label',
    'checkbox_label',
    'text',
    'bare_checkbox',
    'notes',
    'choice',
    'switch',
    'tab',
    'menuitem',
  ];
  ids.forEach((id) => {
    expect([id, isInteractiveControl(document.getElementById(id))]).toEqual([id, true]);
  });
});

test('isInteractiveControl skips plain elements, hidden inputs and toggles inside labels', () => {
  ['anchor', 'plain_label', 'hidden', 'radio', 'checkbox', 'plain', 'bl-form'].forEach((id) => {
    expect([id, isInteractiveControl(document.getElementById(id))]).toEqual([id, false]);
  });
});

test('findInteractiveControls returns the controls in document order', () => {
  expect(findInteractiveControls(document.getElementById('bl-form')).map((el) => el.id)).toEqual([
    'save',
    'custom',
    'link',
    'radio_label',
    'checkbox_label',
    'text',
    'bare_checkbox',
    'notes',
    'choice',
    'switch',
    'tab',
    'menuitem',
  ]);
});
