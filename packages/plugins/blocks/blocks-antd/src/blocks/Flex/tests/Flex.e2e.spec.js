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

test.describe('Flex Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'flex_block');
  });

  test('renders children horizontally by default', async ({ page }) => {
    const block = getBlock(page, 'flex_horizontal');
    await expect(block).toBeVisible();
    const flex = block.locator('.ant-flex');
    await expect(flex).toBeVisible();
    // Should not have vertical class by default
    await expect(flex).not.toHaveClass(/ant-flex-vertical/);
  });

  test('renders children vertically when vertical is true', async ({ page }) => {
    const block = getBlock(page, 'flex_vertical');
    const flex = block.locator('.ant-flex');
    await expect(flex).toHaveClass(/ant-flex-vertical/);
  });

  test('renders with gap', async ({ page }) => {
    const block = getBlock(page, 'flex_gap');
    const flex = block.locator('.ant-flex');
    await expect(flex).toBeVisible();
    const gap = await flex.evaluate((el) => getComputedStyle(el).gap);
    expect(gap).toBe('24px');
  });

  test('applies justify-content', async ({ page }) => {
    const block = getBlock(page, 'flex_justify');
    const flex = block.locator('.ant-flex');
    await expect(flex).toBeVisible();
    const justifyContent = await flex.evaluate((el) => getComputedStyle(el).justifyContent);
    expect(justifyContent).toBe('space-between');
  });
});
