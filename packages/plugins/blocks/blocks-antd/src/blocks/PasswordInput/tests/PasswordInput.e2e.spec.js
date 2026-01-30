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

test.describe('PasswordInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'passwordinput');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'passwordinput_basic');
    await expect(block).toBeVisible();
    const label = block.locator('label');
    await expect(label).toContainText('Basic Password');
  });

  test('renders as password type (masked)', async ({ page }) => {
    const input = getInput(page, 'passwordinput_basic');
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('renders with initial value', async ({ page }) => {
    const input = getInput(page, 'passwordinput_with_value');
    await expect(input).toHaveValue('secret123');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with placeholder', async ({ page }) => {
    const input = getInput(page, 'passwordinput_placeholder');
    await expect(input).toHaveAttribute('placeholder', 'Enter password');
  });

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'passwordinput_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const input = getInput(page, 'passwordinput_small');
    await expect(input).toHaveClass(/ant-input-sm/);
  });

  test('renders large size', async ({ page }) => {
    const input = getInput(page, 'passwordinput_large');
    await expect(input).toHaveClass(/ant-input-lg/);
  });

  test('renders borderless style', async ({ page }) => {
    const input = getInput(page, 'passwordinput_borderless');
    await expect(input).toHaveClass(/ant-input-borderless/);
  });

  test('hides visibility toggle when visibilityToggle is false', async ({ page }) => {
    const block = getBlock(page, 'passwordinput_no_toggle');
    const toggle = block.locator('.ant-input-password-icon');
    await expect(toggle).toBeHidden();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when typing', async ({ page }) => {
    const input = getInput(page, 'passwordinput_onchange');
    await input.fill('newpassword');

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: newpassword');
  });

  test('onBlur event fires when input loses focus', async ({ page }) => {
    const input = getInput(page, 'passwordinput_onblur');

    await input.focus();
    await input.blur();

    const display = getBlock(page, 'onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  test('onFocus event fires when input gains focus', async ({ page }) => {
    const input = getInput(page, 'passwordinput_onfocus');
    await input.focus();

    const display = getBlock(page, 'onfocus_display');
    await expect(display).toHaveText('Focus fired');
  });

  test('onPressEnter event fires when Enter is pressed', async ({ page }) => {
    const input = getInput(page, 'passwordinput_onpressenter');
    await input.focus();
    await page.keyboard.press('Enter');

    const display = getBlock(page, 'onpressenter_display');
    await expect(display).toHaveText('Enter pressed');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can toggle password visibility', async ({ page }) => {
    const block = getBlock(page, 'passwordinput_visibility');
    const input = getInput(page, 'passwordinput_visibility');

    // Type password
    await input.fill('mypassword');

    // Should be hidden initially
    await expect(input).toHaveAttribute('type', 'password');

    // Click visibility toggle
    const toggle = block.locator('.ant-input-password-icon');
    await toggle.click();

    // Should now be visible
    await expect(input).toHaveAttribute('type', 'text');

    // Click again to hide
    await toggle.click();
    await expect(input).toHaveAttribute('type', 'password');
  });
});
