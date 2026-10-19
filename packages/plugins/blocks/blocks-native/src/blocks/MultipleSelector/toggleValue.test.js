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
import { isSameValues, toggleValue } from './toggleValue.js';

test('toggleValue adds a value at the end, or takes it out', () => {
  expect(toggleValue({ value: 'api', values: ['ui'] })).toEqual(['ui', 'api']);
  expect(toggleValue({ value: 'ui', values: ['ui', 'api'] })).toEqual(['api']);
  expect(toggleValue({ value: { id: 1, a: 2 }, values: [{ a: 2, id: 1 }] })).toEqual([]);
});

test('isSameValues compares the values in any order', () => {
  expect(isSameValues(['ui', 'api'], ['api', 'ui'])).toBe(true);
  expect(isSameValues(['ui'], ['ui', 'api'])).toBe(false);
  expect(isSameValues([], [])).toBe(true);
  expect(isSameValues([{ a: 1 }], [{ a: 2 }])).toBe(false);
});
