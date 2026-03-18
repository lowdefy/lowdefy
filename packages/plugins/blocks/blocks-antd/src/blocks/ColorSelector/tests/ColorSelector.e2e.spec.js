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

test.describe('ColorSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'color_selector');
  });

  test('renders color picker trigger', async ({ page }) => {
    const block = getBlock(page, 'cs_basic');
    await expect(block).toBeVisible();
    const trigger = block.locator('.ant-color-picker-trigger');
    await expect(trigger).toBeVisible();
  });

  test('opens picker on click', async ({ page }) => {
    const block = getBlock(page, 'cs_basic');
    const trigger = block.locator('.ant-color-picker-trigger');
    await trigger.click();
    await expect(page.locator('.ant-color-picker')).toBeVisible();
  });

  test('fires onChange when color is picked', async ({ page }) => {
    const block = getBlock(page, 'cs_change');
    const trigger = block.locator('.ant-color-picker-trigger');
    await trigger.click();

    // Click inside the saturation area to change the color
    const panel = page.locator('.ant-color-picker-panel');
    await expect(panel).toBeVisible();
    await panel.locator('.ant-color-picker-saturation').click();

    const display = getBlock(page, 'cs_change_display');
    await expect(display).toHaveText('Changed!');
  });

  test('renders disabled state', async ({ page }) => {
    const block = getBlock(page, 'cs_disabled');
    const trigger = block.locator('.ant-color-picker-trigger');
    await expect(trigger).toHaveClass(/ant-color-picker-trigger-disabled/);
  });

  test('renders different sizes', async ({ page }) => {
    const small = getBlock(page, 'cs_small');
    const middle = getBlock(page, 'cs_middle');
    const large = getBlock(page, 'cs_large');

    await expect(small.locator('.ant-color-picker-trigger')).toBeVisible();
    await expect(middle.locator('.ant-color-picker-trigger')).toBeVisible();
    await expect(large.locator('.ant-color-picker-trigger')).toBeVisible();

    await expect(small.locator('.ant-color-picker-trigger')).toHaveClass(/ant-color-picker-sm/);
    await expect(large.locator('.ant-color-picker-trigger')).toHaveClass(/ant-color-picker-lg/);
  });
});
