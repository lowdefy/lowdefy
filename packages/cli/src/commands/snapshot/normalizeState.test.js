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

import normalizeState from './normalizeState.js';

test('normalizeState replaces ISO timestamps and UUIDs in nested values', () => {
  expect(
    normalizeState({
      state: {
        form: { created_at: '2026-03-04T10:11:12.345Z', offset: '2026-03-04T10:11:12+02:00' },
        rows: [{ id: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }],
      },
    })
  ).toEqual({
    form: { created_at: '[TS]', offset: '[TS]' },
    rows: [{ id: '[UUID]' }],
  });
});

test('normalizeState replaces a timestamp embedded in a longer string', () => {
  expect(normalizeState({ state: { note: 'saved at 2026-03-04T10:11:12.345Z by me' } })).toEqual({
    note: 'saved at [TS] by me',
  });
});

test('normalizeState leaves other values, keys and plain dates alone', () => {
  const state = { count: 3, on: true, day: '2026-03-04', empty: null, list: ['a'] };
  expect(normalizeState({ state })).toEqual(state);
});

test('normalizeState treats a missing state as empty', () => {
  expect(normalizeState({ state: undefined })).toEqual({});
});

test('normalizeState is idempotent', () => {
  const once = normalizeState({ state: { a: '2026-03-04T10:11:12.345Z' } });
  expect(normalizeState({ state: once })).toEqual(once);
});
