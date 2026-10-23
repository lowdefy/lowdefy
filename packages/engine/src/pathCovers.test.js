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

import pathCovers from './pathCovers.js';
import { expect, test } from 'vitest';

test('a path covers itself', () => {
  expect(pathCovers({ path: 'contact.extra', target: 'contact.extra' })).toBe(true);
});

test('a path covers the paths below it', () => {
  expect(pathCovers({ path: 'contact', target: 'contact.extra' })).toBe(true);
  expect(pathCovers({ path: 'contact', target: 'contact.items.0.label' })).toBe(true);
});

test('a path does not cover a sibling that shares its prefix', () => {
  expect(pathCovers({ path: 'contact', target: 'contactx.extra' })).toBe(false);
});

test('a path does not cover its parent or an unrelated path', () => {
  expect(pathCovers({ path: 'contact.extra', target: 'contact' })).toBe(false);
  expect(pathCovers({ path: 'other', target: 'contact.extra' })).toBe(false);
});

test('an escaped dot is part of a segment', () => {
  expect(pathCovers({ path: 'a\\.b', target: 'a\\.b.c' })).toBe(true);
  expect(pathCovers({ path: 'a', target: 'a\\.b' })).toBe(false);
});
