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

import eq from './eq.js';

const location = 'location';

test('_eq false', () => {
  expect(eq({ params: [1, 2], location })).toEqual(false);
  expect(eq({ params: [0, 1], location })).toEqual(false);
  expect(eq({ params: [false, true], location })).toEqual(false);
  expect(eq({ params: [true, false], location })).toEqual(false);
});
test('_eq true', () => {
  expect(eq({ params: [1, 1], location })).toEqual(true);
  expect(eq({ params: [0, 0], location })).toEqual(true);
  expect(eq({ params: [true, true], location })).toEqual(true);
  expect(eq({ params: [false, false], location })).toEqual(true);
});
test('_eq errors', () => {
  expect(() => eq({ params: 'hello', location })).toThrow(
    'Operator Error: _eq takes an array type as input. Received: "hello" at location.'
  );
  expect(() => eq({ params: null, location })).toThrow(
    'Operator Error: _eq takes an array type as input. Received: null at location.'
  );
  expect(() => eq({ params: true, location })).toThrow(
    'Operator Error: _eq takes an array type as input. Received: true at location.'
  );
  expect(() => eq({ params: false, location })).toThrow(
    'Operator Error: _eq takes an array type as input. Received: false at location.'
  );
  expect(() => eq({ params: [1, 2, 3], location })).toThrow(
    'Operator Error: _eq takes an array of length 2 as input. Received: [1,2,3] at location.'
  );
});
