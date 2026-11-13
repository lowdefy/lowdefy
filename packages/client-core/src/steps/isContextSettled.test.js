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

import isContextSettled from './isContextSettled.js';

const DEADLINE = 10000;

function createContext({ events = {}, onInitAsync, onInitAsyncDone = true } = {}) {
  const root = { Events: { events: onInitAsync === undefined ? {} : { onInitAsync } } };
  return {
    _internal: {
      onInitDone: true,
      onInitAsyncDone,
      RootSlots: {
        map: { root, button: { Events: { events } } },
        slots: { root: { blocks: [root] } },
      },
    },
    requests: {},
    websockets: {},
  };
}

test('isContextSettled is true when nothing is running', () => {
  expect(isContextSettled({ context: createContext(), deadline: DEADLINE, lowdefy: {} })).toBe(
    true
  );
});

test('isContextSettled is false while a block event is running', () => {
  const context = createContext({ events: { onClick: { loading: true, waitingUntil: null } } });
  expect(isContextSettled({ context, deadline: DEADLINE, lowdefy: {} })).toBe(false);
});

test('isContextSettled is false while an event sleeps in a Wait that ends before the deadline', () => {
  const context = createContext({
    events: { onClick: { loading: true, waitingUntil: DEADLINE - 1 } },
  });
  expect(isContextSettled({ context, deadline: DEADLINE, lowdefy: {} })).toBe(false);
});

test('isContextSettled is true while the only running event sleeps in a Wait that ends after the deadline', () => {
  const context = createContext({
    events: { onMountAsync: { loading: true, waitingUntil: DEADLINE + 1 } },
  });
  expect(isContextSettled({ context, deadline: DEADLINE, lowdefy: {} })).toBe(true);
});

test('isContextSettled is false before onInitAsync has run', () => {
  const context = createContext({ onInitAsyncDone: false });
  expect(isContextSettled({ context, deadline: DEADLINE, lowdefy: {} })).toBe(false);
});

test('isContextSettled is true while onInitAsync sleeps in a Wait that ends after the deadline', () => {
  const context = createContext({
    onInitAsync: { loading: true, waitingUntil: DEADLINE + 1 },
    onInitAsyncDone: false,
  });
  expect(isContextSettled({ context, deadline: DEADLINE, lowdefy: {} })).toBe(true);
});

test('isContextSettled is false while the app onInitAsync is working', () => {
  const appContext = createContext({
    onInitAsync: { loading: true, waitingUntil: null },
    onInitAsyncDone: false,
  });
  expect(
    isContextSettled({ context: createContext(), deadline: DEADLINE, lowdefy: { appContext } })
  ).toBe(false);
});

test('isContextSettled is true while the app onInitAsync sleeps in a Wait that ends after the deadline', () => {
  const appContext = createContext({
    onInitAsync: { loading: true, waitingUntil: DEADLINE + 1 },
    onInitAsyncDone: false,
  });
  expect(
    isContextSettled({ context: createContext(), deadline: DEADLINE, lowdefy: { appContext } })
  ).toBe(true);
});
