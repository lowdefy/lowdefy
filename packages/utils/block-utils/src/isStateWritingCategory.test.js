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

import isStateWritingCategory from './isStateWritingCategory.js';

test('isStateWritingCategory is true for the categories the engine writes into state', () => {
  expect(isStateWritingCategory('input')).toBe(true);
  expect(isStateWritingCategory('input-container')).toBe(true);
  expect(isStateWritingCategory('list')).toBe(true);
});

test('isStateWritingCategory is false for display, container and an unknown category', () => {
  expect(isStateWritingCategory('display')).toBe(false);
  expect(isStateWritingCategory('container')).toBe(false);
  expect(isStateWritingCategory(undefined)).toBe(false);
});
