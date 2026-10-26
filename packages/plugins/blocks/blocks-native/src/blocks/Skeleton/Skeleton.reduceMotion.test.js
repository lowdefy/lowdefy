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

import { jest } from '@jest/globals';
import { AccessibilityInfo } from 'react-native';

import { page, renderPage, screen } from '../../test/renderPage.js';

test('with Reduce Motion on, a Skeleton is a static fill with no shimmer', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  await renderPage({
    pageConfig: page([{ id: 'bar', type: 'Skeleton', properties: { height: 12 } }]),
  });
  expect(await screen.findByTestId('bar_skeleton')).toBeTruthy();
  expect(screen.queryByTestId('bar_skeleton_shimmer')).toBeNull();
});
