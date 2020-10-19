/*
  Copyright 2020 Lowdefy, Inc

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

import getRemovedFromArray from './getRemovedFromArray';

test('getRemovedFromArray defaults', () => {
  const res = getRemovedFromArray();
  expect(res).toEqual([]);
});

test('getRemovedFromArray both empty', () => {
  const res = getRemovedFromArray([], []);
  expect(res).toEqual([]);
});

test('getRemovedFromArray nothing removed', () => {
  const res = getRemovedFromArray(['1'], ['1', '2']);
  expect(res).toEqual([]);
});

test('getRemovedFromArray one item removed', () => {
  const res = getRemovedFromArray(['1', '2'], ['1']);
  expect(res).toEqual(['2']);
});

test('getRemovedFromArray multiple items removed', () => {
  const res = getRemovedFromArray(['1', '2', '3', '4'], ['1', '3', '5', '6']);
  expect(res).toEqual(['2', '4']);
});
