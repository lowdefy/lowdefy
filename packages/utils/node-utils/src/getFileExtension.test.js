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

import getFileExtension, { getFileSubExtension } from './getFileExtension.js';

test('getFileExtension a', () => {
  expect(getFileExtension('a')).toBe(null);
});

test('getFileExtension a.b', () => {
  expect(getFileExtension('a.b')).toBe('b');
});

test('getFileExtension a.b.c', () => {
  expect(getFileExtension('a.b.c')).toBe('c');
});

test('getFileSubExtension a', () => {
  expect(getFileSubExtension('a')).toBe(null);
});

test('getFileSubExtension a.b', () => {
  expect(getFileSubExtension('a.b')).toBe(null);
});

test('getFileSubExtension a.b.c', () => {
  expect(getFileSubExtension('a.b.c')).toBe('b');
});

test('getFileSubExtension a.b.c.d', () => {
  expect(getFileSubExtension('a.b.c.d')).toBe('c');
});
