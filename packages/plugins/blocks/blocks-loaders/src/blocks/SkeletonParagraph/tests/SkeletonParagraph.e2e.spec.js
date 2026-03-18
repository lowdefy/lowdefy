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

test.describe('SkeletonParagraph Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'skeletonparagraph');
  });

  test('renders with default 4 lines', async ({ page }) => {
    const block = getBlock(page, 'skeletonparagraph_basic');
    await expect(block).toBeVisible();
    const skeletons = getSkeletons(page, 'skeletonparagraph_basic');
    await expect(skeletons).toHaveCount(4);
  });

  test('renders with custom line count', async ({ page }) => {
    const skeletons = getSkeletons(page, 'skeletonparagraph_lines');
    await expect(skeletons).toHaveCount(6);
  });
});
