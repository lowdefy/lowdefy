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

import { afterEach, expect, test, vi } from 'vitest';

import createShortcutManager from './createShortcutManager.js';

// tinykeys resolves `mod` to Meta or Control from navigator.platform.
const MOD = /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'Meta' : 'Control';

const KEY_CODES = {
  '/': 'Slash',
  Escape: 'Escape',
  g: 'KeyG',
  i: 'KeyI',
  s: 'KeyS',
};

let manager;
let elements = [];

afterEach(() => {
  manager?.destroy();
  manager = undefined;
  elements.forEach((element) => element.remove());
  elements = [];
});

function createBlock({ shortcut, visible = true }) {
  return {
    Events: { events: { onClick: { shortcut } } },
    visibleEval: { output: visible },
    triggerEvent: vi.fn(),
  };
}

function initManager(blocks) {
  manager = createShortcutManager();
  manager.init({
    _internal: {
      RootSlots: { map: blocks },
      lowdefy: { _internal: { globals: { window } } },
    },
  });
}

function addElement(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  const element = container.firstElementChild;
  document.body.appendChild(element);
  elements.push(element);
  return element;
}

function press(key, { target = document.body, mod = false, repeat = false, isComposing } = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    code: KEY_CODES[key],
    repeat,
    isComposing,
    bubbles: true,
    cancelable: true,
  });
  // tinykeys reads modifiers with getModifierState, which jsdom does not derive from ctrlKey or
  // metaKey.
  event.getModifierState = (modifier) => mod && modifier === MOD;
  target.dispatchEvent(event);
  return event;
}

test('createShortcutManager fires a modifier shortcut and prevents the browser default', () => {
  const save = createBlock({ shortcut: 'mod+s' });
  initManager({ save });
  const event = press('s', { mod: true });
  expect(save.triggerEvent).toHaveBeenCalledWith({ name: 'onClick' });
  expect(event.defaultPrevented).toBe(true);
});

test('createShortcutManager fires a modifier shortcut while focus is in a form field', () => {
  const save = createBlock({ shortcut: 'mod+s' });
  initManager({ save });
  press('s', { mod: true, target: addElement('<input />') });
  press('s', { mod: true, target: addElement('<textarea></textarea>') });
  press('s', { mod: true, target: addElement('<div contenteditable="true"></div>') });
  expect(save.triggerEvent).toHaveBeenCalledTimes(3);
});

test('createShortcutManager fires a plain shortcut outside form fields', () => {
  const search = createBlock({ shortcut: '/' });
  initManager({ search });
  press('/');
  expect(search.triggerEvent).toHaveBeenCalledTimes(1);
});

test('createShortcutManager does not fire a plain shortcut while focus is in a form field', () => {
  const search = createBlock({ shortcut: '/' });
  const close = createBlock({ shortcut: 'Escape' });
  initManager({ search, close });
  [
    '<input />',
    '<textarea></textarea>',
    '<select></select>',
    '<div contenteditable="true"></div>',
  ].forEach((html) => {
    const target = addElement(html);
    press('/', { target });
    press('Escape', { target });
  });
  expect(search.triggerEvent).not.toHaveBeenCalled();
  expect(close.triggerEvent).not.toHaveBeenCalled();
});

test('createShortcutManager ignores the repeats of a held key', () => {
  const save = createBlock({ shortcut: 'mod+s' });
  const search = createBlock({ shortcut: '/' });
  initManager({ save, search });
  press('s', { mod: true });
  press('s', { mod: true, repeat: true });
  press('s', { mod: true, repeat: true });
  press('/');
  press('/', { repeat: true });
  expect(save.triggerEvent).toHaveBeenCalledTimes(1);
  expect(search.triggerEvent).toHaveBeenCalledTimes(1);
});

test('createShortcutManager ignores key presses that are part of IME composition', () => {
  const save = createBlock({ shortcut: 'mod+s' });
  initManager({ save });
  press('s', { mod: true, isComposing: true, target: addElement('<input />') });
  expect(save.triggerEvent).not.toHaveBeenCalled();
});

test('createShortcutManager fires a key sequence when its keys are pressed in order', () => {
  const inbox = createBlock({ shortcut: 'g i' });
  initManager({ inbox });
  press('g');
  expect(inbox.triggerEvent).not.toHaveBeenCalled();
  press('i');
  expect(inbox.triggerEvent).toHaveBeenCalledTimes(1);
});

test('createShortcutManager does not advance a key sequence from keys typed in a form field', () => {
  const inbox = createBlock({ shortcut: 'g i' });
  initManager({ inbox });
  press('g', { target: addElement('<input />') });
  press('i');
  expect(inbox.triggerEvent).not.toHaveBeenCalled();
});

test('createShortcutManager does not fire the shortcut of a hidden block', () => {
  const hidden = createBlock({ shortcut: 'mod+s', visible: false });
  initManager({ hidden });
  const event = press('s', { mod: true });
  expect(hidden.triggerEvent).not.toHaveBeenCalled();
  expect(event.defaultPrevented).toBe(false);
});

test('createShortcutManager binds every shortcut in a shortcut array', () => {
  const search = createBlock({ shortcut: ['mod+s', '/'] });
  initManager({ search });
  press('s', { mod: true });
  press('/');
  expect(search.triggerEvent).toHaveBeenCalledTimes(2);
});

test('createShortcutManager stops firing shortcuts after destroy', () => {
  const save = createBlock({ shortcut: 'mod+s' });
  const search = createBlock({ shortcut: '/' });
  initManager({ save, search });
  manager.destroy();
  press('s', { mod: true });
  press('/');
  expect(save.triggerEvent).not.toHaveBeenCalled();
  expect(search.triggerEvent).not.toHaveBeenCalled();
});
