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

import joinPath from './joinPath.js';
import splitPath from './splitPath.js';

test('joinPath returns the segment for a single segment path', () => {
  expect(joinPath(['a'])).toEqual('a');
});

test('joinPath joins segments with a dot separator', () => {
  expect(joinPath(['a', 'b', 'c'])).toEqual('a.b.c');
});

test('joinPath escapes a literal dot inside a segment', () => {
  expect(joinPath(['a', 'b.c'])).toEqual('a.b\\.c');
});

test('joinPath escapes every literal dot inside a single segment', () => {
  expect(joinPath(['a.b.c'])).toEqual('a\\.b\\.c');
});

test('joinPath returns an empty string for an empty segment array', () => {
  expect(joinPath([])).toEqual('');
});

test('joinPath keeps empty segments', () => {
  expect(joinPath(['a', '', 'b'])).toEqual('a..b');
});

test('joinPath stringifies numeric segments', () => {
  expect(joinPath(['a', 0, 'b'])).toEqual('a.0.b');
});

test('joinPath throws a TypeError when segments is a string', () => {
  expect(() => joinPath('a')).toThrow(TypeError);
  expect(() => joinPath('a')).toThrow('joinPath: segments must be an array. Received "a".');
});

test('joinPath throws a TypeError when segments is undefined', () => {
  expect(() => joinPath()).toThrow(TypeError);
});

test('joinPath round-trips segments with a literal dot through splitPath', () => {
  expect(splitPath(joinPath(['a', 'b.c', 'd']))).toEqual(['a', 'b.c', 'd']);
});

test('joinPath round-trips plain segments through splitPath', () => {
  expect(splitPath(joinPath(['a', 'b', 'c']))).toEqual(['a', 'b', 'c']);
});
