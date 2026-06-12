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
import _boolean from './boolean.js';

const location = 'location';

console.error = () => {};

test('_boolean returns false for falsy values', () => {
  expect(_boolean({ params: 0, location })).toEqual(false);
  expect(_boolean({ params: null, location })).toEqual(false);
  expect(_boolean({ params: undefined, location })).toEqual(false);
  expect(_boolean({ params: false, location })).toEqual(false);
  expect(_boolean({ params: '', location })).toEqual(false);
  expect(_boolean({ params: NaN, location })).toEqual(false);
});
test('_boolean returns true for truthy values', () => {
  expect(_boolean({ params: 1, location })).toEqual(true);
  expect(_boolean({ params: true, location })).toEqual(true);
  expect(_boolean({ params: [0, 0], location })).toEqual(true);
  expect(_boolean({ params: {}, location })).toEqual(true);
  expect(_boolean({ params: 'string', location })).toEqual(true);
});
