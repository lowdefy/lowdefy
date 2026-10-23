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

import changeSkeletonHolds from './changeSkeletonHolds.js';
import { afterEach, expect, test } from 'vitest';

afterEach(() => {
  delete global.window;
});

test('changeSkeletonHolds mirrors the count of held skeletons onto window', () => {
  global.window = {};
  changeSkeletonHolds(1);
  changeSkeletonHolds(1);
  expect(global.window.__lowdefySkeletonHolds).toBe(2);
  changeSkeletonHolds(-1);
  changeSkeletonHolds(-1);
  expect(global.window.__lowdefySkeletonHolds).toBe(0);
});

test('changeSkeletonHolds keeps counting without a window', () => {
  changeSkeletonHolds(1);
  global.window = {};
  changeSkeletonHolds(-1);
  expect(global.window.__lowdefySkeletonHolds).toBe(0);
});
