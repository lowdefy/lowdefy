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

import getMediaChanges from './getMediaChanges.js';

const previous = { size: 'md', width: 800, height: 600 };

test('getMediaChanges returns only the keys whose values changed', () => {
  expect(getMediaChanges({ previous, next: { size: 'md', width: 900, height: 600 } })).toEqual([
    'media:width',
  ]);
  expect(getMediaChanges({ previous, next: { size: 'lg', width: 1100, height: 500 } })).toEqual([
    'media:size',
    'media:width',
    'media:height',
  ]);
});

test('getMediaChanges returns no keys when the viewport is unchanged', () => {
  expect(getMediaChanges({ previous, next: { ...previous } })).toEqual([]);
});

test('getMediaChanges treats every key as changed without an earlier reading', () => {
  expect(getMediaChanges({ previous: null, next: previous })).toEqual([
    'media:size',
    'media:width',
    'media:height',
  ]);
});

test('getMediaChanges returns no keys without a window reading', () => {
  expect(getMediaChanges({ previous, next: null })).toEqual([]);
});
