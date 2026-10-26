// @vitest-environment jsdom
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

import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import OpenInEditorListener from './OpenInEditorListener.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
let frames;
let elementFromPoint;

function flushFrames() {
  const pending = [...frames];
  frames.length = 0;
  act(() => {
    pending.forEach((callback) => callback?.());
  });
}

function move(x, y, init = {}) {
  const event = new MouseEvent('pointermove', {
    clientX: x,
    clientY: y,
    altKey: true,
    bubbles: true,
    ...init,
  });
  act(() => {
    window.dispatchEvent(event);
  });
}

beforeEach(() => {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (callback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', (id) => {
    frames[id - 1] = null;
  });
  document.body.innerHTML = '<div id="bl-a"></div><div id="bl-b"></div>';
  elementFromPoint = vi.fn((x) => document.getElementById(x < 100 ? 'bl-a' : 'bl-b'));
  document.elementFromPoint = elementFromPoint;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(React.createElement(OpenInEditorListener, { basePath: '', pageId: 'page' }));
  });
});

afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

test('many pointer moves with Alt held resolve the hover once, at the latest point', () => {
  move(10, 10);
  move(20, 20);
  move(150, 30);
  expect(frames.filter(Boolean)).toHaveLength(1);
  expect(elementFromPoint).not.toHaveBeenCalled();

  flushFrames();
  expect(elementFromPoint).toHaveBeenCalledTimes(1);
  expect(elementFromPoint).toHaveBeenCalledWith(150, 30);
  expect(document.body.textContent).toContain('b');
  expect(document.body.classList.contains('lowdefy-open-in-editor-target')).toBe(true);
});

test('a move in a later frame schedules a new resolve', () => {
  move(10, 10);
  flushFrames();
  move(150, 10);
  flushFrames();
  expect(elementFromPoint).toHaveBeenCalledTimes(2);
});

test('a move without the modifier cancels the pending resolve and clears the highlight', () => {
  move(10, 10);
  flushFrames();
  expect(document.body.classList.contains('lowdefy-open-in-editor-target')).toBe(true);

  move(10, 10);
  move(11, 11, { altKey: false });
  flushFrames();
  expect(elementFromPoint).toHaveBeenCalledTimes(1);
  expect(document.body.classList.contains('lowdefy-open-in-editor-target')).toBe(false);
});

test('unmount cancels a pending resolve', () => {
  move(10, 10);
  act(() => root.unmount());
  flushFrames();
  expect(elementFromPoint).not.toHaveBeenCalled();
  root = createRoot(container);
});
