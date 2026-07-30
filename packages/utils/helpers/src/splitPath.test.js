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

import splitPath from './splitPath.js';
import joinPath from './joinPath.js';

test('splitPath returns a single segment for a path without separators', () => {
  expect(splitPath('a')).toEqual(['a']);
});

test('splitPath splits a dot separated path into segments', () => {
  expect(splitPath('a.b.c')).toEqual(['a', 'b', 'c']);
});

test('splitPath keeps an escaped dot inside the last segment', () => {
  expect(splitPath('a.b\\.c')).toEqual(['a', 'b.c']);
});

test('splitPath keeps an escaped dot inside a middle segment', () => {
  expect(splitPath('a.b\\.c.d')).toEqual(['a', 'b.c', 'd']);
});

test('splitPath returns one segment when every dot is escaped', () => {
  expect(splitPath('a\\.b\\.c')).toEqual(['a.b.c']);
});

test('splitPath returns an array with an empty segment for an empty path', () => {
  expect(splitPath('')).toEqual(['']);
});

test('splitPath treats a trailing escaped dot as an escaped dot on an empty tail', () => {
  expect(splitPath('a\\.')).toEqual(['a.']);
});

test('splitPath keeps a trailing backslash literal when no segment follows', () => {
  expect(splitPath('a\\')).toEqual(['a\\']);
});

test('splitPath keeps empty segments produced by consecutive separators', () => {
  expect(splitPath('a..b')).toEqual(['a', '', 'b']);
});

test('splitPath treats a mid segment backslash as a literal character', () => {
  expect(splitPath('a\\b.c')).toEqual(['a\\b', 'c']);
});

test('splitPath keeps numeric segments as strings', () => {
  expect(splitPath('a.0.b')).toEqual(['a', '0', 'b']);
});

test('splitPath throws a TypeError when path is a number', () => {
  expect(() => splitPath(123)).toThrow(TypeError);
  expect(() => splitPath(123)).toThrow('splitPath: path must be a string. Received 123.');
});

test('splitPath throws a TypeError when path is an array', () => {
  expect(() => splitPath(['a', 'b'])).toThrow(TypeError);
});

test('splitPath throws a TypeError when path is undefined', () => {
  expect(() => splitPath()).toThrow(TypeError);
});

test('splitPath round-trips a path with an escaped dot through joinPath', () => {
  expect(joinPath(splitPath('a.b\\.c.d'))).toEqual('a.b\\.c.d');
});
