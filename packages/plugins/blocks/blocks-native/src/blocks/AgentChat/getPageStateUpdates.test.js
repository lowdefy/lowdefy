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

import getPageStateUpdates from './getPageStateUpdates.js';

test('getPageStateUpdates writes only top-level keys the chat shares, and reports the others back', () => {
  expect(
    getPageStateUpdates({
      sharedState: { space: 'ACME', filters: {} },
      updates: { space: 'OPS', filters: { state: 'open' }, 'filters.state': 'open', admin: true },
    })
  ).toEqual({
    writable: { space: 'OPS', filters: { state: 'open' } },
    output: { ok: true, written: ['space', 'filters'], ignored: ['filters.state', 'admin'] },
  });
});

test('getPageStateUpdates never writes a reserved key, even one that is shared', () => {
  expect(
    getPageStateUpdates({
      sharedState: { __proto__x: 1, constructor: 1 },
      updates: { constructor: 2 },
    })
  ).toEqual({ writable: {}, output: { ok: true, written: [], ignored: ['constructor'] } });
});

test('getPageStateUpdates writes nothing without shared state or updates', () => {
  expect(getPageStateUpdates({ sharedState: null, updates: { space: 'OPS' } }).writable).toEqual(
    {}
  );
  expect(getPageStateUpdates({ sharedState: { space: 'ACME' } }).output).toEqual({
    ok: true,
    written: [],
  });
});
