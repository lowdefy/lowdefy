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
// import { ServerParser } from '@lowdefy/operators';

import _if from './if.js';

const location = 'location';

console.error = () => {};

test('_if then', () => {
  expect(_if({ params: { test: true, then: 1, else: 2 }, location })).toEqual(1);
  expect(_if({ params: { test: true, else: 2 }, location })).toEqual(undefined);
});
test('_if else', () => {
  expect(_if({ params: { test: false, then: 1, else: 2 }, location })).toEqual(2);
  expect(_if({ params: { test: false, then: 1 }, location })).toEqual(undefined);
});
test('_if errors', () => {
  expect(() => _if({ params: { then: 1, else: 2 }, location })).toThrow(
    'Operator Error: _if takes a boolean type for parameter test. Received: {"then":1,"else":2} at location.'
  );
  expect(() => _if({ params: { test: { a: [1, 3] }, then: 1, else: 2 }, location })).toThrow(
    'Operator Error: _if takes a boolean type for parameter test. Received: {"test":{"a":[1,3]},"then":1,"else":2} at location.'
  );
  expect(() => _if({ params: { test: 'True', then: 1, else: 2 }, location })).toThrow(
    'Operator Error: _if takes a boolean type for parameter test. Received: {"test":"True","then":1,"else":2} at location.'
  );
  expect(() => _if({ params: { test: 1, then: 1, else: 2 }, location })).toThrow(
    'Operator Error: _if takes a boolean type for parameter test. Received: {"test":1,"then":1,"else":2} at location.'
  );
});
