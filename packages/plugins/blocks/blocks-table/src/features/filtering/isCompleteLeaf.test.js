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

import isCompleteLeaf from './isCompleteLeaf.js';
import { expect, test } from 'vitest';

test('isCompleteLeaf takes a relative before or after leaf as complete only with a whole relative date', () => {
  expect(isCompleteLeaf({ key: 'd', op: 'before', value: { last: 3, unit: 'month' } })).toBe(true);
  expect(isCompleteLeaf({ key: 'd', op: 'after', value: { next: 2, unit: 'week' } })).toBe(true);
  expect(isCompleteLeaf({ key: 'd', op: 'before', value: { unit: 'month' } })).toBe(false);
  expect(isCompleteLeaf({ key: 'd', op: 'before', value: '2026-01-01' })).toBe(true);
  expect(isCompleteLeaf({ key: 'd', op: 'after', value: { $user: 'since' } })).toBe(true);
});
