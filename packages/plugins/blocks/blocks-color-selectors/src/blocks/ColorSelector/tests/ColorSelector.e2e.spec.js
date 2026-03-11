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

// ColorSelector is an input block with Label wrapper.
// It renders a color swatch, a hex color input, and a popover color picker.
const getSwatch = (page, blockId) => getBlock(page, blockId).locator('.color-picker-swatch');
const getColorInput = (page, blockId) => getBlock(page, blockId).locator('.color-picker-input');

test.describe('ColorSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'colorselector');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders with label and swatch', async ({ page }) => {
    const block = getBlock(page, 'colorselector_basic');
    await expect(block).toBeVisible();
    const swatch = getSwatch(page, 'colorselector_basic');
    await expect(swatch).toBeVisible();
  });

  test('renders hex color input', async ({ page }) => {
    const input = getColorInput(page, 'colorselector_basic');
    await expect(input).toBeVisible();
  });

  test('renders with label title', async ({ page }) => {
    const block = getBlock(page, 'colorselector_basic');
    const label = block.locator('label');
    await expect(label).toContainText('Basic Color');
  });

  // ============================================
  // VALUE TESTS
  // ============================================

  test('renders with initial value color', async ({ page }) => {
    const swatch = getSwatch(page, 'colorselector_with_value');
    await expect(swatch).toHaveCSS('background-color', 'rgb(255, 0, 0)');
  });

  test('hex input shows initial value', async ({ page }) => {
    const input = getColorInput(page, 'colorselector_with_value');
    await expect(input).toHaveValue('#ff0000');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const swatch = getSwatch(page, 'colorselector_disabled');
    await expect(swatch).toHaveClass(/color-picker-swatch-disabled/);
    const input = getColorInput(page, 'colorselector_disabled');
    await expect(input).toBeDisabled();
  });

  test('disabled swatch does not open popover', async ({ page }) => {
    const swatch = getSwatch(page, 'colorselector_disabled');
    await swatch.click();
    const popover = getBlock(page, 'colorselector_disabled').locator('.color-picker-popover');
    await expect(popover).not.toBeVisible();
  });

  test('renders small size', async ({ page }) => {
    const swatch = getSwatch(page, 'colorselector_small');
    await expect(swatch).toHaveClass(/color-picker-swatch-sm/);
    const input = getColorInput(page, 'colorselector_small');
    await expect(input).toHaveClass(/ant-input-sm/);
  });

  test('renders large size', async ({ page }) => {
    const swatch = getSwatch(page, 'colorselector_large');
    await expect(swatch).toHaveClass(/color-picker-swatch-lg/);
    const input = getColorInput(page, 'colorselector_large');
    await expect(input).toHaveClass(/ant-input-lg/);
  });

  test('hides hex input when hideInput is true', async ({ page }) => {
    const block = getBlock(page, 'colorselector_hide_input');
    const swatch = getSwatch(page, 'colorselector_hide_input');
    await expect(swatch).toBeVisible();
    const input = block.locator('.color-picker-input');
    await expect(input).not.toBeVisible();
  });

  test('renders label inline', async ({ page }) => {
    const block = getBlock(page, 'colorselector_label_inline');
    await expect(block).toBeVisible();
    const label = block.locator('label');
    await expect(label).toContainText('Inline Label');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('clicking swatch opens color picker popover', async ({ page }) => {
    const swatch = getSwatch(page, 'colorselector_basic');
    await swatch.click();
    const popover = getBlock(page, 'colorselector_basic').locator('.color-picker-popover');
    await expect(popover).toBeVisible();
  });

  test('color picker popover contains HexColorPicker', async ({ page }) => {
    const swatch = getSwatch(page, 'colorselector_basic');
    await swatch.click();
    const picker = getBlock(page, 'colorselector_basic').locator('.react-colorful');
    await expect(picker).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange fires when hex input value changes', async ({ page }) => {
    const input = getColorInput(page, 'colorselector_onchange');
    await input.fill('#0000ff');
    // Click outside to trigger close/onChange
    await getBlock(page, 'onchange_display').click();
    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: #0000ff');
  });
});
