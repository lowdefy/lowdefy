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

test.describe('SkeletonAvatar Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'skeletonavatar');
  });

  test('renders basic avatar skeleton', async ({ page }) => {
    const block = getBlock(page, 'skeletonavatar_basic');
    await expect(block).toBeVisible();
    const skeleton = getSkeleton(page, 'skeletonavatar_basic');
    await expect(skeleton).toBeVisible();
  });

  test('renders small size', async ({ page }) => {
    const skeleton = getSkeleton(page, 'skeletonavatar_small');
    await expect(skeleton).toHaveCSS('width', '24px');
    await expect(skeleton).toHaveCSS('height', '24px');
  });

  test('renders large size', async ({ page }) => {
    const skeleton = getSkeleton(page, 'skeletonavatar_large');
    await expect(skeleton).toHaveCSS('width', '40px');
    await expect(skeleton).toHaveCSS('height', '40px');
  });

  test('renders square shape', async ({ page }) => {
    const skeleton = getSkeleton(page, 'skeletonavatar_square');
    await expect(skeleton).toHaveCSS('border-radius', '0px');
  });
});
