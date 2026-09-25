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

import shouldReloadForTypes from './shouldReloadForTypes.js';

function createWindow({ href = 'https://example.com/orders', throws = false } = {}) {
  const stored = {};
  return {
    location: { href },
    sessionStorage: {
      getItem: (key) => {
        if (throws) throw new Error('storage disabled');
        return stored[key] ?? null;
      },
      setItem: (key, value) => {
        if (throws) throw new Error('storage disabled');
        stored[key] = value;
      },
      removeItem: (key) => {
        delete stored[key];
      },
    },
  };
}

test('shouldReloadForTypes reloads once, renders on the second failure, then may retry', () => {
  const window = createWindow();
  expect(shouldReloadForTypes({ window })).toBe(true);
  expect(shouldReloadForTypes({ window })).toBe(false);
  expect(shouldReloadForTypes({ window })).toBe(true);
});

test('shouldReloadForTypes reloads again at a different URL', () => {
  const window = createWindow();
  expect(shouldReloadForTypes({ window })).toBe(true);
  window.location.href = 'https://example.com/invoices';
  expect(shouldReloadForTypes({ window })).toBe(true);
});

test('shouldReloadForTypes does not reload when storage is disabled', () => {
  expect(shouldReloadForTypes({ window: createWindow({ throws: true }) })).toBe(false);
});
