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

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';
import getSkeletonShape from './getSkeletonShape.js';

test('getSkeletonShape shapes each type family like its cell', () => {
  expect(getSkeletonShape('text')).toBe('text');
  expect(getSkeletonShape('currency')).toBe('number');
  expect(getSkeletonShape('avatar')).toBe('person');
  expect(getSkeletonShape('people')).toBe('person');
  expect(getSkeletonShape('tag')).toBe('pill');
  expect(getSkeletonShape('status')).toBe('pill');
  expect(getSkeletonShape('boolean')).toBe('square');
  expect(getSkeletonShape('buttons')).toBe('buttons');
  expect(getSkeletonShape('progress')).toBe('progress');
});

test('getSkeletonShape gives every cell type a shape', () => {
  const shapes = new Set(['text', 'number', 'person', 'pill', 'square', 'buttons', 'progress']);
  Object.keys(CELL_TYPE_FAMILIES).forEach((type) => {
    expect(shapes.has(getSkeletonShape(type))).toBe(true);
  });
});

test('getSkeletonShape falls back to a text bar for an unknown type', () => {
  expect(getSkeletonShape(undefined)).toBe('text');
});
