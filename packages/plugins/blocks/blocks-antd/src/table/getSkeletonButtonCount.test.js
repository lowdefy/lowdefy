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

import getSkeletonButtonCount from './getSkeletonButtonCount.js';

const buttons = [{ eventName: 'a' }, { eventName: 'b' }, { eventName: 'c' }];

test('getSkeletonButtonCount shows one square per configured button', () => {
  expect(getSkeletonButtonCount({ column: { cell: { buttons } } })).toBe(3);
});

test('getSkeletonButtonCount shows no squares for hover buttons', () => {
  expect(getSkeletonButtonCount({ column: { cell: { buttons, showOn: 'hover' } } })).toBe(0);
});

test('getSkeletonButtonCount shows no squares without buttons', () => {
  expect(getSkeletonButtonCount({ column: { cell: {} } })).toBe(0);
});
