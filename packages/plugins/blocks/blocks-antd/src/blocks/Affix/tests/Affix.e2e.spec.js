/*
  Copyright 2020-2024 Lowdefy, Inc

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

test.describe('Affix Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'affix');
  });

  test('renders affix with content', async ({ page }) => {
    const block = getBlock(page, 'affix_basic');
    await expect(block).toBeVisible();

    // Content should be visible
    const button = block.locator('.ant-btn');
    await expect(button).toBeVisible();
    await expect(button).toContainText('Affix Button');
  });

  test('renders affix with offset top content', async ({ page }) => {
    const block = getBlock(page, 'affix_offset_top');
    await expect(block).toBeVisible();
    await expect(block).toContainText('Offset Top 50px');
  });

  test('renders styled affix', async ({ page }) => {
    const block = getBlock(page, 'affix_styled');
    await expect(block).toBeVisible();

    // Alert content should be visible
    const alert = block.locator('.ant-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Styled Affix Alert');
  });

  test('affix becomes fixed when scrolling', async ({ page }) => {
    const block = getBlock(page, 'affix_basic');
    await expect(block).toBeVisible();

    // Scroll down to trigger affix
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(100);

    // Check for ant-affix class (applied when affixed)
    const affixedElement = block.locator('.ant-affix');
    await expect(affixedElement).toBeVisible();
  });
});
