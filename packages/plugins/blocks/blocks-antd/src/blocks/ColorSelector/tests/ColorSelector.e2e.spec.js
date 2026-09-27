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

test.describe('ColorSelector antd 6 features', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'color_selector');
  });

  test('applies ColorPicker design tokens from theme', async ({ page }) => {
    const trigger = getBlock(page, 'cs_theme').locator('.ant-color-picker-trigger');
    await expect(trigger).toHaveCSS('height', '48px');
  });

  test('applies the popup cssKey to the popup', async ({ page }) => {
    await getBlock(page, 'cs_popup').locator('.ant-color-picker-trigger').click();
    await expect(page.locator('.cs-custom-popup')).toBeVisible();
  });

  test('clearing the color sets the value to null', async ({ page }) => {
    const block = getBlock(page, 'cs_clearable');
    await expect(getBlock(page, 'cs_clearable_display')).toHaveText('Value: #1677ff');
    await block.locator('.ant-color-picker-trigger').click();
    const popup = page.locator('.ant-color-picker-inner:visible');
    await popup.locator('.ant-color-picker-clear').click();
    await expect(getBlock(page, 'cs_clearable_display')).toHaveText('Value: null');
    await expect(block.locator('.ant-color-picker-trigger .ant-color-picker-clear')).toBeVisible();
  });

  test('gradient mode reads and writes a linear-gradient value', async ({ page }) => {
    const block = getBlock(page, 'cs_gradient');
    await expect(
      block.locator('.ant-color-picker-trigger .ant-color-picker-color-block-inner')
    ).toHaveAttribute('style', /linear-gradient/);
    await block.locator('.ant-color-picker-trigger').click();
    const popup = page.locator('.ant-color-picker-inner:visible');
    await expect(popup.locator('.ant-color-picker-gradient-slider')).toBeVisible();
    await popup.locator('.ant-color-picker-saturation').click();
    await expect(getBlock(page, 'cs_gradient_display')).toHaveText(
      /^Value: linear-gradient\(90deg, /
    );
    // The block value is read back as a gradient, so the picker stays in gradient mode.
    await expect(popup.locator('.ant-color-picker-gradient-slider')).toBeVisible();
  });

  test('mode array shows a single and gradient switch', async ({ page }) => {
    await getBlock(page, 'cs_modes').locator('.ant-color-picker-trigger').click();
    const popup = page.locator('.ant-color-picker-inner:visible');
    await expect(popup.locator('.ant-segmented')).toBeVisible();
  });

  test('selects a preset color', async ({ page }) => {
    await getBlock(page, 'cs_presets').locator('.ant-color-picker-trigger').click();
    const popup = page.locator('.ant-color-picker-inner:visible');
    const presets = popup.locator('.ant-color-picker-presets');
    await expect(presets).toContainText('Brand');
    await presets.locator('.ant-color-picker-presets-color').nth(1).click();
    await expect(getBlock(page, 'cs_presets_display')).toHaveText('Value: #722ed1');
  });
});
