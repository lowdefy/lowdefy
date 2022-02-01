/*
  Copyright 2020-2021 Lowdefy, Inc

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

import and from './and.js';

const location = 'location';

test('_and false', () => {
  expect(and({ params: [0, 0], location })).toEqual(false);
  expect(and({ params: [0, 1], location })).toEqual(false);
  expect(and({ params: [1, 2, 3, 0], location })).toEqual(false);
  expect(and({ params: [false, false], location })).toEqual(false);
  expect(and({ params: [false, true], location })).toEqual(false);
});
test('_and true', () => {
  expect(and({ params: [1, 2], location })).toEqual(true);
  expect(and({ params: [1, 2, 3], location })).toEqual(true);
  expect(and({ params: [true, true], location })).toEqual(true);
});
test('_and errors', () => {
  expect(() => and({ params: 'hello', location })).toThrow(
    'Operator Error: _and takes an array type. Received: "hello" at location.'
  );
  expect(() => and({ params: null, location })).toThrow(
    'Operator Error: _and takes an array type. Received: null at location.'
  );
  expect(() => and({ params: true, location })).toThrow(
    'Operator Error: _and takes an array type. Received: true at location.'
  );
  expect(() => and({ params: false, location })).toThrow(
    'Operator Error: _and takes an array type. Received: false at location.'
  );
});
