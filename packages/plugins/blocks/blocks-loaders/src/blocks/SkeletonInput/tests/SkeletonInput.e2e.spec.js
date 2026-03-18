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

const getSkeletons = (page, blockId) => getBlock(page, blockId).locator('.skeleton');

test.describe('SkeletonInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'skeletoninput');
  });

  test('renders with label and input skeletons', async ({ page }) => {
    const block = getBlock(page, 'skeletoninput_basic');
    await expect(block).toBeVisible();
    const skeletons = getSkeletons(page, 'skeletoninput_basic');
    await expect(skeletons).toHaveCount(2);
  });

  test('renders without label when label is false', async ({ page }) => {
    const skeletons = getSkeletons(page, 'skeletoninput_no_label');
    await expect(skeletons).toHaveCount(1);
  });

  test('renders small size', async ({ page }) => {
    const skeletons = getSkeletons(page, 'skeletoninput_small');
    await expect(skeletons.last()).toHaveCSS('height', '24px');
  });
});
