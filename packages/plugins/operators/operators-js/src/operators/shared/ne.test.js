/*
  Copyright 2020-2024 Lowdefy, Inc

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

import ne from './ne.js';

const location = 'locationId';

test('_ne param 0 equal 1', () => {
  expect(ne({ params: [1, 1], location })).toBe(false);
  expect(ne({ params: [0, 0], location })).toBe(false);
  expect(ne({ params: [null, null], location })).toBe(false);
  expect(ne({ params: [true, true], location })).toBe(false);
  expect(ne({ params: [false, false], location })).toBe(false);
  expect(ne({ params: ['123', '123'], location })).toBe(false);
  expect(ne({ params: [new Date(1).toString(), new Date(1).toString()], location })).toBe(false);
});

test('_ne param 0 not eq 1', () => {
  expect(ne({ params: [0, 1], location })).toBe(true);
  expect(ne({ params: [-1, 0], location })).toBe(true);
  expect(ne({ params: [-1, 1], location })).toBe(true);
  expect(ne({ params: [0.1, 0.2], location })).toBe(true);
  expect(ne({ params: [null, 1], location })).toBe(true);
  expect(ne({ params: [null, 0], location })).toBe(true);
  expect(ne({ params: [new Date(1), new Date(2)], location })).toBe(true);
  expect(ne({ params: [new Date(1), new Date(1)], location })).toBe(true);
  expect(ne({ params: [false, true], location })).toBe(true);
  expect(ne({ params: ['a', 'b'], location })).toBe(true);
  expect(ne({ params: ['aa', 'b'], location })).toBe(true);
  expect(ne({ params: ['b', 'bb'], location })).toBe(true);
});

test('_ne params not an array', () => {
  expect(() => ne({ params: '1, 0', location })).toThrow(
    'Operator Error: _ne takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_ne params array with length 1', () => {
  expect(() => ne({ params: [1], location })).toThrow(
    'Operator Error: _ne takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_ne params array with length 3', () => {
  expect(() => ne({ params: [1, 2, 3], location })).toThrow(
    'Operator Error: _ne takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});
