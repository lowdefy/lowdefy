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

import holdRows from './holdRows.js';

const rows = [{ id: 1 }, { id: 2 }];

test('holdRows keeps the last rows while loading and data is null', () => {
  expect(holdRows({ data: null, loading: true, held: rows })).toEqual({ rows, held: rows });
});

test('holdRows keeps the last rows while loading and data is empty', () => {
  expect(holdRows({ data: [], loading: true, held: rows }).rows).toBe(rows);
});

test('holdRows shows data once loading ends, even when it is empty', () => {
  expect(holdRows({ data: [], loading: false, held: rows })).toEqual({ rows: [], held: [] });
});

test('holdRows shows null data as no rows when nothing is loading', () => {
  expect(holdRows({ data: null, loading: false, held: rows }).rows).toEqual([]);
});

test('holdRows shows new rows while still loading', () => {
  const next = [{ id: 3 }];
  expect(holdRows({ data: next, loading: true, held: rows })).toEqual({ rows: next, held: next });
});

test('holdRows returns no rows while loading before any rows arrived', () => {
  expect(holdRows({ data: null, loading: true, held: null }).rows).toEqual([]);
});
