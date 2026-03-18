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

test.describe('MasonryList Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'masonry_list');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders masonry list with items', async ({ page }) => {
    const block = getBlock(page, 'ml_test');
    await expect(block).toBeVisible();

    // MasonryList renders Card children for each item
    const cards = block.locator('.ant-card');
    await expect(cards).toHaveCount(3);
  });

  test('displays item data from state', async ({ page }) => {
    const block = getBlock(page, 'ml_test');
    await expect(block).toBeVisible();

    // Check that item content is rendered from state
    await expect(block).toContainText('Item A');
    await expect(block).toContainText('Item B');
    await expect(block).toContainText('Item C');
  });
});
