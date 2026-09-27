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

  test('renders no badge element when no badge is set', async ({ page }) => {
    const floatBtn = page.locator('#fb_basic');
    await expect(floatBtn).toBeVisible();
    await expect(floatBtn.locator('.ant-badge')).toHaveCount(0);
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

  test('renders description as the button content', async ({ page }) => {
    const floatBtn = getBlock(page, 'fb_description').locator('.ant-float-btn');
    await expect(floatBtn.locator('span.ant-float-btn-content', { hasText: 'HELP' })).toBeVisible();
  });

  test('renders the app document icon when no icon or description is set', async ({ page }) => {
    const floatBtn = getBlock(page, 'fb_default_icon').locator('.ant-float-btn');
    await expect(floatBtn.locator('svg.lucide')).toBeAttached();
    await expect(floatBtn.locator('.anticon-file-text')).toHaveCount(0);
  });

  test('disables the button', async ({ page }) => {
    const floatBtn = getBlock(page, 'fb_disabled').locator('.ant-float-btn');
    await expect(floatBtn).toBeDisabled();
    await floatBtn.dispatchEvent('click');
    await expect(getBlock(page, 'fb_disabled_display')).toHaveText('disabled:idle');
  });

  test('renders a back to top button with scroll progress', async ({ page }) => {
    const floatBtn = getBlock(page, 'fb_back_top').locator('.ant-float-btn');
    await expect(floatBtn).toBeVisible();
    await expect(floatBtn).toHaveClass(/ant-float-btn-progress/);
    await expect(floatBtn.locator('svg.lucide')).toBeAttached();
    await expect(floatBtn.locator('.anticon-vertical-align-top')).toHaveCount(0);
    await floatBtn.dispatchEvent('click');
    await expect(getBlock(page, 'fb_back_top_display')).toHaveText('backtop:clicked');
  });
});
