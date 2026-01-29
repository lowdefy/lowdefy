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

// Helper to get the input element (input has id={blockId}_input)
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

test.describe('TextInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'textinput');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'textinput_basic');
    await expect(block).toBeVisible();
    // Label should contain the title
    const label = block.locator('label');
    await expect(label).toContainText('Basic Input');
  });

  test('renders with initial value', async ({ page }) => {
    const input = getInput(page, 'textinput_with_value');
    await expect(input).toHaveValue('Initial Value');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with placeholder', async ({ page }) => {
    const input = getInput(page, 'textinput_placeholder');
    await expect(input).toHaveAttribute('placeholder', 'Enter text here');
  });

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'textinput_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const input = getInput(page, 'textinput_small');
    await expect(input).toHaveClass(/ant-input-sm/);
  });

  test('renders large size', async ({ page }) => {
    const input = getInput(page, 'textinput_large');
    await expect(input).toHaveClass(/ant-input-lg/);
  });

  test('renders borderless style', async ({ page }) => {
    const input = getInput(page, 'textinput_borderless');
    await expect(input).toHaveClass(/ant-input-borderless/);
  });

  test('renders with allowClear and clears on click', async ({ page }) => {
    const block = getBlock(page, 'textinput_allowclear');
    const input = getInput(page, 'textinput_allowclear');

    // Should have initial value
    await expect(input).toHaveValue('Clear me');

    // Hover to reveal clear button
    await block.hover();
    const clearBtn = block.locator('.ant-input-clear-icon');
    await clearBtn.click();

    // Value should be cleared
    await expect(input).toHaveValue('');
  });

  test('enforces maxLength', async ({ page }) => {
    const input = getInput(page, 'textinput_maxlength');
    await expect(input).toHaveAttribute('maxlength', '10');
  });

  test('shows character count', async ({ page }) => {
    const block = getBlock(page, 'textinput_showcount');
    const count = block.locator('.ant-input-show-count-suffix');
    await expect(count).toBeVisible();
  });

  test('renders with prefix text', async ({ page }) => {
    const block = getBlock(page, 'textinput_prefix');
    const prefix = block.locator('.ant-input-prefix');
    await expect(prefix).toHaveText('$');
  });

  test('renders with suffix text', async ({ page }) => {
    const block = getBlock(page, 'textinput_suffix');
    const suffix = block.locator('.ant-input-suffix');
    await expect(suffix).toHaveText('USD');
  });

  test('renders with prefix icon', async ({ page }) => {
    const block = getBlock(page, 'textinput_prefixicon');
    const prefix = block.locator('.ant-input-prefix');
    const svg = prefix.locator('svg');
    await expect(svg).toBeAttached();
  });

  test('renders with suffix icon', async ({ page }) => {
    const block = getBlock(page, 'textinput_suffixicon');
    const suffix = block.locator('.ant-input-suffix');
    const svg = suffix.locator('svg');
    await expect(svg).toBeAttached();
  });

  test('renders with inline label', async ({ page }) => {
    const block = getBlock(page, 'textinput_label_inline');
    // Inline label uses ant-row class inside the wrapper
    const formItem = block.locator('.ant-row');
    await expect(formItem).toBeVisible();
  });

  test('renders label extra text', async ({ page }) => {
    const block = getBlock(page, 'textinput_label_extra');
    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Additional help text');
  });

  // ============================================
  // TYPE TESTS
  // ============================================

  test('renders email type', async ({ page }) => {
    const input = getInput(page, 'textinput_type_email');
    await expect(input).toHaveAttribute('type', 'email');
  });

  test('renders tel type', async ({ page }) => {
    const input = getInput(page, 'textinput_type_tel');
    await expect(input).toHaveAttribute('type', 'tel');
  });

  test('renders url type', async ({ page }) => {
    const input = getInput(page, 'textinput_type_url');
    await expect(input).toHaveAttribute('type', 'url');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when typing', async ({ page }) => {
    const input = getInput(page, 'textinput_onchange');
    await input.fill('Hello World');

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: Hello World');
  });

  test('onBlur event fires when input loses focus', async ({ page }) => {
    const input = getInput(page, 'textinput_onblur');

    // Focus then blur
    await input.focus();
    await input.blur();

    const display = getBlock(page, 'onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  test('onFocus event fires when input gains focus', async ({ page }) => {
    const input = getInput(page, 'textinput_onfocus');
    await input.focus();

    const display = getBlock(page, 'onfocus_display');
    await expect(display).toHaveText('Focus fired');
  });

  test('onPressEnter event fires when Enter is pressed', async ({ page }) => {
    const input = getInput(page, 'textinput_onpressenter');
    await input.focus();
    await page.keyboard.press('Enter');

    const display = getBlock(page, 'onpressenter_display');
    await expect(display).toHaveText('Enter pressed');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can type text into input', async ({ page }) => {
    const input = getInput(page, 'textinput_typing');
    await input.fill('Test input value');

    const display = getBlock(page, 'typing_display');
    await expect(display).toHaveText('Typed: Test input value');
  });

  test('can clear and retype text', async ({ page }) => {
    const input = getInput(page, 'textinput_typing');

    // Type initial value
    await input.fill('First');
    await expect(input).toHaveValue('First');

    // Clear and type new value
    await input.fill('Second');
    await expect(input).toHaveValue('Second');
  });
});
