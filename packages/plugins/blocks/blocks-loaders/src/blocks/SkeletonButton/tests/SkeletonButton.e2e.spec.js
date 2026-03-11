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

test.describe('SkeletonButton Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'skeletonbutton');
  });

  test('renders basic button skeleton', async ({ page }) => {
    const block = getBlock(page, 'skeletonbutton_basic');
    await expect(block).toBeVisible();
    const skeleton = getSkeleton(page, 'skeletonbutton_basic');
    await expect(skeleton).toBeVisible();
  });

  test('renders small size', async ({ page }) => {
    const skeleton = getSkeleton(page, 'skeletonbutton_small');
    await expect(skeleton).toHaveCSS('height', '24px');
  });

  test('renders large size', async ({ page }) => {
    const skeleton = getSkeleton(page, 'skeletonbutton_large');
    await expect(skeleton).toHaveCSS('height', '40px');
  });
});
