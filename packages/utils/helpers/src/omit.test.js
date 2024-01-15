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

import omit from './omit.js';

test('omit flat keys', () => {
  const obj = { a: 1, b: 2, c: 3, d: 4 };
  omit(obj, ['a', 'd']);
  expect(obj).toEqual({ b: 2, c: 3 });
});

test('omit nest keys', () => {
  const obj = { a: 1, x: { b: 2, c: 3 }, d: 4 };
  omit(obj, ['a', 'x.c']);
  expect(obj).toEqual({ x: { b: 2 }, d: 4 });
});

// TODO: decide how arrays should be handled as this is how delete handles arrays.
test('omit array keys', () => {
  const obj = { a: [1, 2, 3, 4], b: 1, d: 4 };
  omit(obj, ['d', 'a.2']);
  expect(obj).toEqual({ a: [1, 2, undefined, 4], b: 1 });
});
