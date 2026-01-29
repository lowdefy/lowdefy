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

// Helper to get the autocomplete input
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

// Helper to get the autocomplete wrapper
const getAutoComplete = (page, blockId) => page.locator(`.ant-select:has(#${blockId}_input)`);

// Helper to get an option by index
const getOption = (page, blockId, index) => page.locator(`#${blockId}_${index}`);

test.describe('AutoComplete Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'auto_complete');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with default placeholder', async ({ page }) => {
    const wrapper = getAutoComplete(page, 'ac_basic');
    await expect(wrapper).toBeVisible();
    // AutoComplete shows placeholder in a span, not as input attribute
    const placeholder = wrapper.locator('.ant-select-selection-placeholder');
    await expect(placeholder).toHaveText('Type or select item');
  });

  test('renders with initial value', async ({ page }) => {
    const input = getInput(page, 'ac_with_value');
    await expect(input).toHaveValue('Apple');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with custom placeholder', async ({ page }) => {
    const wrapper = getAutoComplete(page, 'ac_placeholder');
    const placeholder = wrapper.locator('.ant-select-selection-placeholder');
    await expect(placeholder).toHaveText('Start typing...');
  });

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'ac_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const wrapper = getAutoComplete(page, 'ac_small');
    await expect(wrapper).toHaveClass(/ant-select-sm/);
  });

  test('renders large size', async ({ page }) => {
    const wrapper = getAutoComplete(page, 'ac_large');
    await expect(wrapper).toHaveClass(/ant-select-lg/);
  });

  test('renders borderless style', async ({ page }) => {
    const wrapper = getAutoComplete(page, 'ac_borderless');
    await expect(wrapper).toHaveClass(/ant-select-borderless/);
  });

  test('shows dropdown when defaultOpen is true', async ({ page }) => {
    // The ac_default_open block should have its dropdown visible
    // First focus the input to ensure the dropdown is triggered
    const input = getInput(page, 'ac_default_open');
    await input.click();
    // Dropdown should be visible
    const dropdown = page.locator('.ant-select-dropdown:visible');
    await expect(dropdown.first()).toBeVisible();
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'ac_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Search fruits/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'ac_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Fruit name/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Type to search or select');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when typing', async ({ page }) => {
    const input = getInput(page, 'ac_onchange');
    await input.click();
    await input.fill('test');

    const display = getBlock(page, 'ac_onchange_display');
    await expect(display).toHaveText('Value: test');
  });

  test('onChange event fires when option selected', async ({ page }) => {
    const input = getInput(page, 'ac_onchange');
    await input.click();

    // Select Banana (index 1)
    await getOption(page, 'ac_onchange', 1).click();

    const display = getBlock(page, 'ac_onchange_display');
    await expect(display).toHaveText('Value: Banana');
  });

  test('onClear event fires when input cleared', async ({ page }) => {
    const wrapper = getAutoComplete(page, 'ac_onclear');

    // Hover to reveal clear button
    await wrapper.hover();
    const clearBtn = wrapper.locator('.ant-select-clear');
    await clearBtn.click();

    const display = getBlock(page, 'ac_onclear_display');
    await expect(display).toHaveText('Clear fired');
  });

  test('onBlur event fires when input loses focus', async ({ page }) => {
    const input = getInput(page, 'ac_onblur');

    await input.click();
    await page.click('body');

    const display = getBlock(page, 'ac_onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  test('onFocus event fires when input gains focus', async ({ page }) => {
    const input = getInput(page, 'ac_onfocus');
    await input.click();

    const display = getBlock(page, 'ac_onfocus_display');
    await expect(display).toHaveText('Focus fired');
  });

  test('onSearch event fires when typing', async ({ page }) => {
    const input = getInput(page, 'ac_onsearch');
    await input.click();
    await input.fill('App');

    const display = getBlock(page, 'ac_onsearch_display');
    await expect(display).toHaveText('Search: App');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('shows dropdown with options when focused', async ({ page }) => {
    const input = getInput(page, 'ac_interaction');
    await input.click();

    // Options should be visible
    await expect(getOption(page, 'ac_interaction', 0)).toBeVisible();
    await expect(getOption(page, 'ac_interaction', 0)).toHaveText('Apple');
  });

  test('filters options when typing', async ({ page }) => {
    const input = getInput(page, 'ac_interaction');
    await input.click();
    await input.fill('Bl');

    // Only Blueberry should be visible (index 3)
    await expect(getOption(page, 'ac_interaction', 3)).toBeVisible();
    await expect(getOption(page, 'ac_interaction', 3)).toHaveText('Blueberry');
    // Other options should not be visible
    await expect(getOption(page, 'ac_interaction', 0)).not.toBeVisible();
  });

  test('can select option from dropdown', async ({ page }) => {
    const input = getInput(page, 'ac_interaction');
    await input.click();

    await getOption(page, 'ac_interaction', 2).click();

    await expect(input).toHaveValue('Banana');
  });

  test('can type custom value not in options', async ({ page }) => {
    const input = getInput(page, 'ac_interaction');
    await input.click();
    await input.fill('Custom Value');

    await expect(input).toHaveValue('Custom Value');
  });

  test('can clear input with clear button', async ({ page }) => {
    const input = getInput(page, 'ac_interaction');
    const wrapper = getAutoComplete(page, 'ac_interaction');

    // Type something first
    await input.click();
    await input.fill('Test');
    await expect(input).toHaveValue('Test');

    // Clear
    await wrapper.hover();
    const clearBtn = wrapper.locator('.ant-select-clear');
    await clearBtn.click();

    await expect(input).toHaveValue('');
  });

  test('hides clear button when allowClear is false', async ({ page }) => {
    const input = getInput(page, 'ac_no_allowclear');
    const wrapper = getAutoComplete(page, 'ac_no_allowclear');

    // Type something
    await input.click();
    await input.fill('Test');

    // Hover - clear button should not be visible
    await wrapper.hover();
    await expect(wrapper.locator('.ant-select-clear')).not.toBeVisible();
  });

  test('can navigate options with keyboard', async ({ page }) => {
    const input = getInput(page, 'ac_interaction');
    await input.click();

    // Press down arrow to highlight first option
    await page.keyboard.press('ArrowDown');

    // Press Enter to select
    await page.keyboard.press('Enter');

    await expect(input).toHaveValue('Apple');
  });

  test('closes dropdown on Escape', async ({ page }) => {
    const input = getInput(page, 'ac_interaction');
    await input.click();

    const dropdown = page.locator('.ant-select-dropdown');
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
  });

  test('backfill shows highlighted option in input', async ({ page }) => {
    const input = getInput(page, 'ac_backfill');
    await input.click();

    // Press down arrow to highlight first option
    await page.keyboard.press('ArrowDown');

    // With backfill, the input should show the highlighted option
    await expect(input).toHaveValue('Apple');
  });
});
