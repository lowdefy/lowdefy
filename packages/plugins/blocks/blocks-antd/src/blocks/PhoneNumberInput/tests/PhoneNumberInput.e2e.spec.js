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

// Helper to get the phone number input element
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

// Helper to get the country code selector
const getCodeSelector = (page, blockId) =>
  page.locator(`#bl-${blockId} .ant-select:has(#${blockId}_select_input)`);

test.describe('PhoneNumberInput Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'phonenumberinput');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'phone_basic');
    await expect(block).toBeVisible();
    const label = block.locator('label');
    await expect(label).toContainText('Basic Phone Input');
  });

  test('renders phone input element', async ({ page }) => {
    const input = getInput(page, 'phone_basic');
    await expect(input).toBeVisible();
  });

  test('renders country code selector', async ({ page }) => {
    const selector = getCodeSelector(page, 'phone_basic');
    await expect(selector).toBeVisible();
  });

  test('renders with placeholder', async ({ page }) => {
    const input = getInput(page, 'phone_with_placeholder');
    await expect(input).toHaveAttribute('placeholder', 'Enter phone number');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'phone_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const input = getInput(page, 'phone_small');
    await expect(input).toHaveClass(/ant-input-sm/);
  });

  test('renders large size', async ({ page }) => {
    const input = getInput(page, 'phone_large');
    await expect(input).toHaveClass(/ant-input-lg/);
  });

  test('renders with default region US', async ({ page }) => {
    const selector = getCodeSelector(page, 'phone_default_region');
    const selected = selector.locator('.ant-select-selection-item');
    // US dial code is +1
    await expect(selected).toContainText('+1');
  });

  test('limits regions when allowedRegions is set', async ({ page }) => {
    const selector = getCodeSelector(page, 'phone_allowed_regions');
    await selector.click();

    // Wait for dropdown to open
    const dropdown = page.locator('.ant-select-dropdown:visible');
    await expect(dropdown).toBeVisible();

    // Should only have 3 options (US, GB, ZA)
    const options = dropdown.locator('.ant-select-item-option');
    await expect(options).toHaveCount(3);
  });

  test('hides flags when showFlags is false', async ({ page }) => {
    const selector = getCodeSelector(page, 'phone_no_flags');
    const selected = selector.locator('.ant-select-selection-item');
    // Should show dial code without flag emoji
    const text = await selected.textContent();
    // Flags are emoji characters - check that dial code shows without flag
    expect(text).toMatch(/^\+\d+$/);
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when typing phone number', async ({ page }) => {
    const input = getInput(page, 'phone_onchange');
    await input.fill('5551234567');

    const display = getBlock(page, 'onchange_display');
    await expect(display).toContainText('Phone:');
  });

  test('onInputChange event fires when typing', async ({ page }) => {
    const input = getInput(page, 'phone_oninputchange');
    await input.fill('123');

    const display = getBlock(page, 'oninputchange_display');
    await expect(display).toHaveText('Input changed');
  });

  test('onCodeChange event fires when changing country code', async ({ page }) => {
    const selector = getCodeSelector(page, 'phone_oncodechange');
    await selector.click();

    // Select a different country
    const option = page.locator('.ant-select-dropdown:visible .ant-select-item-option').nth(5);
    await option.click();

    const display = getBlock(page, 'oncodechange_display');
    await expect(display).toHaveText('Code changed');
  });

  test('onBlur event fires when input loses focus', async ({ page }) => {
    const input = getInput(page, 'phone_onblur');
    await input.focus();
    await input.blur();

    const display = getBlock(page, 'onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  test('onFocus event fires when input gains focus', async ({ page }) => {
    const input = getInput(page, 'phone_onfocus');
    await input.focus();

    const display = getBlock(page, 'onfocus_display');
    await expect(display).toHaveText('Focus fired');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can type phone number', async ({ page }) => {
    const input = getInput(page, 'phone_interaction');
    await input.fill('9876543210');

    const display = getBlock(page, 'interaction_display');
    await expect(display).toHaveText('Input: 9876543210');
  });

  test('can search and select country code', async ({ page }) => {
    const selector = getCodeSelector(page, 'phone_interaction');
    await selector.click();

    // Type to search for United Kingdom (keyboard events go to the dropdown's search input)
    await page.keyboard.type('United Kingdom');

    // Wait for filtered results
    await page.waitForTimeout(300);

    // Select the UK option
    const ukOption = page
      .locator('.ant-select-dropdown:visible .ant-select-item-option:visible')
      .first();
    await ukOption.click();

    // Verify UK is selected (+44)
    const selected = selector.locator('.ant-select-selection-item');
    await expect(selected).toContainText('+44');
  });

  test('can clear input value when allowClear is true', async ({ page }) => {
    const block = getBlock(page, 'phone_allowclear');
    const input = getInput(page, 'phone_allowclear');

    // Type a value first
    await input.fill('1234567890');
    await expect(input).toHaveValue('1234567890');

    // Hover to show clear button
    await block.hover();
    const clearBtn = block.locator('.ant-input-clear-icon');
    await clearBtn.click();

    await expect(input).toHaveValue('');
  });
});
