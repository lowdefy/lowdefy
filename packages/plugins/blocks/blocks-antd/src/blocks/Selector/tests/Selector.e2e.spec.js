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

// Helper to get the selector wrapper (the ant-select container)
const getSelector = (page, blockId) => page.locator(`.ant-select:has(#${blockId}_input)`);

// Helper to get an option by index (options have id={blockId}_{index})
const getOption = (page, blockId, index) => page.locator(`#${blockId}_${index}`);

test.describe('Selector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'selector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with default placeholder', async ({ page }) => {
    const selector = getSelector(page, 'selector_basic');
    await expect(selector).toBeVisible();
    const placeholder = selector.locator('.ant-select-selection-placeholder');
    await expect(placeholder).toHaveText('Select item');
  });

  test('renders with initial value', async ({ page }) => {
    const selector = getSelector(page, 'selector_with_value');
    await expect(selector).toBeVisible();
    const selectedItem = selector.locator('.ant-select-selection-item');
    await expect(selectedItem).toHaveText('Option 2');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with custom placeholder', async ({ page }) => {
    const selector = getSelector(page, 'selector_placeholder');
    const placeholder = selector.locator('.ant-select-selection-placeholder');
    await expect(placeholder).toHaveText('Choose an item');
  });

  test('renders disabled state', async ({ page }) => {
    const selector = getSelector(page, 'selector_disabled');
    await expect(selector).toHaveClass(/ant-select-disabled/);
  });

  test('renders small size', async ({ page }) => {
    const selector = getSelector(page, 'selector_small');
    await expect(selector).toHaveClass(/ant-select-sm/);
  });

  test('renders large size', async ({ page }) => {
    const selector = getSelector(page, 'selector_large');
    await expect(selector).toHaveClass(/ant-select-lg/);
  });

  test('renders borderless style', async ({ page }) => {
    const selector = getSelector(page, 'selector_borderless');
    await expect(selector).toHaveClass(/ant-select-borderless/);
  });

  test('hides clear button when allowClear is false', async ({ page }) => {
    const selector = getSelector(page, 'selector_no_allowclear');
    // Has a value but no clear button
    await expect(selector.locator('.ant-select-selection-item')).toHaveText('A');
    await expect(selector.locator('.ant-select-clear')).toBeHidden();
  });

  test('hides arrow when showArrow is false', async ({ page }) => {
    const selector = getSelector(page, 'selector_no_arrow');
    await expect(selector.locator('.ant-select-arrow')).toBeHidden();
  });

  // ============================================
  // OPTIONS TESTS
  // ============================================

  test('renders primitive options in dropdown', async ({ page }) => {
    const selector = getSelector(page, 'selector_basic');
    await selector.click();

    // Check options are visible using their ids
    await expect(getOption(page, 'selector_basic', 0)).toHaveText('Option 1');
    await expect(getOption(page, 'selector_basic', 1)).toHaveText('Option 2');
    await expect(getOption(page, 'selector_basic', 2)).toHaveText('Option 3');
  });

  test('renders object options with labels', async ({ page }) => {
    const selector = getSelector(page, 'selector_object_options');
    await selector.click();

    await expect(getOption(page, 'selector_object_options', 0)).toHaveText('First Option');
    await expect(getOption(page, 'selector_object_options', 1)).toHaveText('Second Option');
    await expect(getOption(page, 'selector_object_options', 2)).toHaveText('Third Option');
  });

  test('renders disabled option correctly', async ({ page }) => {
    const selector = getSelector(page, 'selector_disabled_option');
    await selector.click();

    // Disabled option is at index 1
    const disabledOption = getOption(page, 'selector_disabled_option', 1);
    await expect(disabledOption).toHaveText('Disabled Option');
    // Ant Design uses a class for disabled state
    await expect(disabledOption).toHaveClass(/ant-select-item-option-disabled/);
  });

  test('shows not found content for empty options', async ({ page }) => {
    const selector = getSelector(page, 'selector_empty_options');
    await selector.click();

    const notFound = page.locator('.ant-select-item-empty');
    await expect(notFound).toHaveText('No items available');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when option selected', async ({ page }) => {
    const selector = getSelector(page, 'selector_onchange');
    await selector.click();

    // Banana is at index 1 (Apple=0, Banana=1, Cherry=2)
    await getOption(page, 'selector_onchange', 1).click();

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Selected: Banana');
  });

  test('onClear event fires when selection cleared', async ({ page }) => {
    const selector = getSelector(page, 'selector_onclear');

    // Hover to reveal clear button
    await selector.hover();
    const clearBtn = selector.locator('.ant-select-clear');
    await clearBtn.click();

    const display = getBlock(page, 'onclear_display');
    await expect(display).toHaveText('Clear fired');
  });

  test('onBlur event fires when selector loses focus', async ({ page }) => {
    const selector = getSelector(page, 'selector_onblur');

    // Focus then blur
    await selector.click();
    await page.keyboard.press('Escape');
    await page.click('body');

    const display = getBlock(page, 'onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  test('onFocus event fires when selector gains focus', async ({ page }) => {
    const selector = getSelector(page, 'selector_onfocus');
    await selector.click();

    const display = getBlock(page, 'onfocus_display');
    await expect(display).toHaveText('Focus fired');
  });

  test('onSearch event fires when typing in search', async ({ page }) => {
    const selector = getSelector(page, 'selector_onsearch');
    await selector.click();

    // Type in search
    await page.keyboard.type('App');

    const display = getBlock(page, 'onsearch_display');
    await expect(display).toHaveText('Search: App');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can select an option from dropdown', async ({ page }) => {
    const selector = getSelector(page, 'selector_basic');
    await selector.click();

    // Option 3 is at index 2
    await getOption(page, 'selector_basic', 2).click();

    const selectedItem = selector.locator('.ant-select-selection-item');
    await expect(selectedItem).toHaveText('Option 3');
  });

  test('can clear selection with clear button', async ({ page }) => {
    const selector = getSelector(page, 'selector_clearable');

    // Verify initial value
    await expect(selector.locator('.ant-select-selection-item')).toHaveText('B');

    // Hover to reveal clear button and click
    await selector.hover();
    const clearBtn = selector.locator('.ant-select-clear');
    await clearBtn.click();

    // Verify cleared - placeholder should be visible
    await expect(selector.locator('.ant-select-selection-placeholder')).toBeVisible();
  });

  test('can filter options by typing', async ({ page }) => {
    const selector = getSelector(page, 'selector_searchable');
    await selector.click();

    // Type to filter
    await page.keyboard.type('Bl');

    // Only Blueberry should be visible (index 3)
    // Other options should be hidden
    await expect(getOption(page, 'selector_searchable', 3)).toBeVisible();
    await expect(getOption(page, 'selector_searchable', 3)).toHaveText('Blueberry');
    await expect(getOption(page, 'selector_searchable', 0)).toBeHidden(); // Apple hidden
  });

  test('cannot select disabled option', async ({ page }) => {
    const selector = getSelector(page, 'selector_disabled_option');
    await selector.click();

    // Try to click disabled option (index 1)
    await getOption(page, 'selector_disabled_option', 1).click();

    // Dropdown should still be open (option not selected)
    const dropdown = page.locator('.ant-select-dropdown');
    await expect(dropdown).toBeVisible();

    // No value should be selected
    await expect(selector.locator('.ant-select-selection-placeholder')).toBeVisible();
  });
});
