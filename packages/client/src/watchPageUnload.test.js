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

import { expect, test } from 'vitest';
import watchPageUnload from './watchPageUnload.js';

function createWindow() {
  const target = new EventTarget();
  return {
    addEventListener: (...args) => target.addEventListener(...args),
    dispatch: (name) => target.dispatchEvent(new Event(name)),
  };
}

test('watchPageUnload starts with the page not unloading', () => {
  const lowdefy = {};
  watchPageUnload({ lowdefy, window: createWindow() });
  expect(lowdefy.unloading).toBe(false);
});

test('watchPageUnload marks the page unloading on beforeunload', () => {
  const lowdefy = {};
  const window = createWindow();
  watchPageUnload({ lowdefy, window });
  window.dispatch('beforeunload');
  expect(lowdefy.unloading).toBe(true);
});

test('watchPageUnload marks the page unloading on pagehide', () => {
  const lowdefy = {};
  const window = createWindow();
  watchPageUnload({ lowdefy, window });
  window.dispatch('pagehide');
  expect(lowdefy.unloading).toBe(true);
});

test('watchPageUnload clears the mark when the page is shown again from the back-forward cache', () => {
  const lowdefy = {};
  const window = createWindow();
  watchPageUnload({ lowdefy, window });
  window.dispatch('pagehide');
  window.dispatch('pageshow');
  expect(lowdefy.unloading).toBe(false);
});
