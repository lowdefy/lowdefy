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
import _not from './not.js';

const location = 'location';

console.error = () => {};

test('_not returns true', () => {
  expect(_not({ params: 0, location })).toEqual(true);
  expect(_not({ params: null, location })).toEqual(true);
  expect(_not({ params: false, location })).toEqual(true);
});
test('_not returns false', () => {
  expect(_not({ params: 1, location })).toEqual(false);
  expect(_not({ params: true, location })).toEqual(false);
  expect(_not({ params: [0, 0], location })).toEqual(false);
  expect(_not({ params: 'string', location })).toEqual(false);
});
