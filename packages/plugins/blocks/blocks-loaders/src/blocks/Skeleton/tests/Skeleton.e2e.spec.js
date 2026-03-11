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

import { test, expect } from '@playwright/test';
import { getBlock, navigateToTestPage } from '@lowdefy/block-dev-e2e';

const getSkeleton = (page, blockId) => getBlock(page, blockId).locator('.skeleton');

test.describe('Skeleton Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'skeleton');
  });

  test('renders basic skeleton', async ({ page }) => {
    const block = getBlock(page, 'skeleton_basic');
    await expect(block).toBeVisible();
    const skeleton = getSkeleton(page, 'skeleton_basic');
    await expect(skeleton).toBeVisible();
  });

  test('renders with custom width and height', async ({ page }) => {
    const skeleton = getSkeleton(page, 'skeleton_sized');
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toHaveCSS('width', '200px');
    await expect(skeleton).toHaveCSS('height', '50px');
  });
});
