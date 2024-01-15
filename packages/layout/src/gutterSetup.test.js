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

import gutterSetup from './gutterSetup.js';

test('no gutter specified', () => {
  expect(gutterSetup(undefined)).toEqual(undefined);
});

test('gutter is int', () => {
  expect(gutterSetup(10)).toEqual([10, 10]);
});

test('gutter is 0', () => {
  expect(gutterSetup(0)).toEqual([0, 0]);
});

test('gutter is array', () => {
  expect(gutterSetup([10, 20])).toEqual([10, 20]);
});

test('gutter is object', () => {
  expect(gutterSetup({ sm: 10, md: 20 }, null)).toEqual([
    { sm: 10, md: 20 },
    { sm: 10, md: 20 },
  ]);
});
