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

import formatIconTitle from './formatIconTitle.js';

test('formatIconTitle keeps a one-word set name', () => {
  expect(formatIconTitle('Pencil')).toBe('Pencil');
});

test('formatIconTitle splits a PascalCase set name into sentence case words', () => {
  expect(formatIconTitle('ArrowLeftRight')).toBe('Arrow left right');
});

test('formatIconTitle turns a semantic kebab name into sentence case words', () => {
  expect(formatIconTitle('more-vertical')).toBe('More vertical');
  expect(formatIconTitle('edit')).toBe('Edit');
});

test('formatIconTitle drops the set of a qualified name', () => {
  expect(formatIconTitle('lucide:Pencil')).toBe('Pencil');
  expect(formatIconTitle('react-icons:AiOutlineUser')).toBe('Ai outline user');
});

test('formatIconTitle keeps digits with the word before them', () => {
  expect(formatIconTitle('Share2')).toBe('Share2');
});

test('formatIconTitle returns an empty title for a missing or non-string name', () => {
  expect(formatIconTitle()).toBe('');
  expect(formatIconTitle(null)).toBe('');
  expect(formatIconTitle({ name: 'Pencil' })).toBe('');
});
