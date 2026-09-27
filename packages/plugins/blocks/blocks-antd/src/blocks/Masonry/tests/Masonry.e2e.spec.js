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

test.describe('Masonry Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'masonry_block');
  });

  test('renders masonry container', async ({ page }) => {
    const block = getBlock(page, 'masonry_basic');
    await expect(block).toBeVisible();
  });

  test('renders all child items', async ({ page }) => {
    const block = getBlock(page, 'masonry_basic');
    const cards = block.locator('.ant-card');
    await expect(cards).toHaveCount(6);
  });

  test('renders with 2 columns setting', async ({ page }) => {
    const block = getBlock(page, 'masonry_two_col');
    await expect(block).toBeVisible();
    const cards = block.locator('.ant-card');
    await expect(cards).toHaveCount(4);
  });

  test('item cssKey styles each item and a responsive gutter applies', async ({ page }) => {
    const block = getBlock(page, 'masonry_item_styled');
    const items = block.locator('.ant-masonry-item');
    await expect(items).toHaveCount(2);
    await expect(items.first()).toHaveCSS('outline-color', 'rgb(255, 0, 0)');
    // Desktop viewport matches the md breakpoint: 20px between the two columns.
    const first = await items.nth(0).boundingBox();
    const second = await items.nth(1).boundingBox();
    expect(Math.round(second.x - (first.x + first.width))).toBe(20);
  });
});
