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

test.describe('FloatButton Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'float_button');
  });

  test('renders float button', async ({ page }) => {
    const floatBtn = page.locator('.ant-float-btn').first();
    await expect(floatBtn).toBeVisible();
  });

  test('renders primary type', async ({ page }) => {
    const block = getBlock(page, 'fb_primary');
    const floatBtn = block.locator('.ant-float-btn');
    await expect(floatBtn).toHaveClass(/ant-float-btn-primary/);
  });

  test('fires onClick event', async ({ page }) => {
    const block = getBlock(page, 'fb_click');
    const floatBtn = block.locator('.ant-float-btn');
    await floatBtn.dispatchEvent('click');

    const display = getBlock(page, 'fb_click_display');
    await expect(display).toHaveText('Clicked!');
  });

  test('shows tooltip on hover', async ({ page }) => {
    const block = getBlock(page, 'fb_tooltip');
    const floatBtn = block.locator('.ant-float-btn');
    await floatBtn.hover();

    await expect(page.locator('.ant-tooltip')).toBeVisible();
    await expect(page.locator('.ant-tooltip')).toContainText('Help');
  });
});
