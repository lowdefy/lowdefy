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

// Helper to get the selector wrapper (the ant-select container)
const getSelector = (page, blockId) => page.locator(`.ant-select:has(#${blockId}_input)`);

// Helper to get an option by index (options have id={blockId}_{index})
const getOption = (page, blockId, index) => page.locator(`#${blockId}_${index}`);

test.describe('MultipleSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'multiple_selector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with default placeholder', async ({ page }) => {
    const selector = getSelector(page, 'ms_basic');
    await expect(selector).toBeVisible();
    const placeholder = selector.locator('.ant-select-selection-placeholder');
    await expect(placeholder).toHaveText('Select items');
  });

  test('renders with initial values as tags', async ({ page }) => {
    const selector = getSelector(page, 'ms_with_value');
    await expect(selector).toBeVisible();
    const selectedItems = selector.locator('.ant-select-selection-item-content');
    await expect(selectedItems).toHaveCount(2);
    await expect(selectedItems.first()).toHaveText('Option 2');
    await expect(selectedItems.last()).toHaveText('Option 3');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders with custom placeholder', async ({ page }) => {
    const selector = getSelector(page, 'ms_placeholder');
    const placeholder = selector.locator('.ant-select-selection-placeholder');
    await expect(placeholder).toHaveText('Choose items');
  });

  test('renders disabled state', async ({ page }) => {
    const selector = getSelector(page, 'ms_disabled');
    await expect(selector).toHaveClass(/ant-select-disabled/);
  });

  test('renders small size', async ({ page }) => {
    const selector = getSelector(page, 'ms_small');
    await expect(selector).toHaveClass(/ant-select-sm/);
  });

  test('renders large size', async ({ page }) => {
    const selector = getSelector(page, 'ms_large');
    await expect(selector).toHaveClass(/ant-select-lg/);
  });

  test('renders borderless style', async ({ page }) => {
    const selector = getSelector(page, 'ms_borderless');
    await expect(selector).toHaveClass(/ant-select-borderless/);
  });

  test('hides clear button when allowClear is false', async ({ page }) => {
    const selector = getSelector(page, 'ms_no_allowclear');
    // Has a value but no clear button
    await expect(selector.locator('.ant-select-selection-item-content').first()).toHaveText('A');
    await expect(selector.locator('.ant-select-clear')).not.toBeVisible();
  });

  test('hides arrow when showArrow is false', async ({ page }) => {
    const selector = getSelector(page, 'ms_no_arrow');
    await expect(selector.locator('.ant-select-arrow')).not.toBeVisible();
  });

  test('limits displayed tags with maxTagCount', async ({ page }) => {
    const selector = getSelector(page, 'ms_max_tag_count');
    await selector.click();

    // Select 4 options (wait for each to be selected)
    await getOption(page, 'ms_max_tag_count', 0).click();
    await expect(getOption(page, 'ms_max_tag_count', 0)).toHaveClass(/ant-select-item-option-selected/);
    await getOption(page, 'ms_max_tag_count', 1).click();
    await expect(getOption(page, 'ms_max_tag_count', 1)).toHaveClass(/ant-select-item-option-selected/);
    await getOption(page, 'ms_max_tag_count', 2).click();
    await expect(getOption(page, 'ms_max_tag_count', 2)).toHaveClass(/ant-select-item-option-selected/);
    await getOption(page, 'ms_max_tag_count', 3).click();
    await expect(getOption(page, 'ms_max_tag_count', 3)).toHaveClass(/ant-select-item-option-selected/);
    await page.keyboard.press('Escape');

    // Should show 2 tags + overflow indicator (maxTagCount=2)
    // Total items = 3: 2 visible tags + 1 overflow indicator (e.g. "+ 2...")
    const allItems = selector.locator('.ant-select-selection-item-content');
    await expect(allItems).toHaveCount(3);
    // The overflow indicator should show "+2" (4 selected - 2 visible = 2 hidden)
    const overflowItem = selector.locator('.ant-select-selection-overflow-item-rest');
    await expect(overflowItem).toBeVisible();
  });

  // ============================================
  // OPTIONS TESTS
  // ============================================

  test('renders primitive options in dropdown', async ({ page }) => {
    const selector = getSelector(page, 'ms_basic');
    await selector.click();

    await expect(getOption(page, 'ms_basic', 0)).toHaveText('Option 1');
    await expect(getOption(page, 'ms_basic', 1)).toHaveText('Option 2');
    await expect(getOption(page, 'ms_basic', 2)).toHaveText('Option 3');
  });

  test('renders object options with labels', async ({ page }) => {
    const selector = getSelector(page, 'ms_object_options');
    await selector.click();

    await expect(getOption(page, 'ms_object_options', 0)).toHaveText('First Option');
    await expect(getOption(page, 'ms_object_options', 1)).toHaveText('Second Option');
    await expect(getOption(page, 'ms_object_options', 2)).toHaveText('Third Option');
  });

  test('renders disabled option correctly', async ({ page }) => {
    const selector = getSelector(page, 'ms_disabled_option');
    await selector.click();

    const disabledOption = getOption(page, 'ms_disabled_option', 1);
    await expect(disabledOption).toHaveText('Disabled Option');
    await expect(disabledOption).toHaveClass(/ant-select-item-option-disabled/);
  });

  test('shows not found content for empty options', async ({ page }) => {
    const selector = getSelector(page, 'ms_empty_options');
    await selector.click();

    const notFound = page.locator('.ant-select-item-empty');
    await expect(notFound).toHaveText('No items available');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when option selected', async ({ page }) => {
    const selector = getSelector(page, 'ms_onchange');
    await selector.click();

    await getOption(page, 'ms_onchange', 1).click();
    await page.keyboard.press('Escape');

    const display = getBlock(page, 'ms_onchange_display');
    await expect(display).toContainText('Selected:');
    await expect(display).toContainText('"Banana"');
  });

  test('onChange event fires with multiple selections', async ({ page }) => {
    const selector = getSelector(page, 'ms_onchange');
    await selector.click();

    await getOption(page, 'ms_onchange', 0).click();
    await getOption(page, 'ms_onchange', 2).click();
    await page.keyboard.press('Escape');

    const display = getBlock(page, 'ms_onchange_display');
    await expect(display).toContainText('Selected:');
    await expect(display).toContainText('"Apple"');
    await expect(display).toContainText('"Cherry"');
  });

  test('onClear event fires when selection cleared', async ({ page }) => {
    const selector = getSelector(page, 'ms_onclear');

    // Hover to reveal clear button
    await selector.hover();
    const clearBtn = selector.locator('.ant-select-clear');
    await clearBtn.click();

    const display = getBlock(page, 'ms_onclear_display');
    await expect(display).toHaveText('Clear fired');
  });

  test('onBlur event fires when selector loses focus', async ({ page }) => {
    const selector = getSelector(page, 'ms_onblur');

    await selector.click();
    await page.keyboard.press('Escape');
    await page.click('body');

    const display = getBlock(page, 'ms_onblur_display');
    await expect(display).toHaveText('Blur fired');
  });

  test('onFocus event fires when selector gains focus', async ({ page }) => {
    const selector = getSelector(page, 'ms_onfocus');
    await selector.click();

    const display = getBlock(page, 'ms_onfocus_display');
    await expect(display).toHaveText('Focus fired');
  });

  test('onSearch event fires when typing in search', async ({ page }) => {
    const selector = getSelector(page, 'ms_onsearch');
    await selector.click();

    await page.keyboard.type('App');

    const display = getBlock(page, 'ms_onsearch_display');
    await expect(display).toHaveText('Search: App');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can select multiple options from dropdown', async ({ page }) => {
    const selector = getSelector(page, 'ms_basic');
    await selector.click();

    await getOption(page, 'ms_basic', 0).click();
    await getOption(page, 'ms_basic', 2).click();
    await page.keyboard.press('Escape');

    const selectedItems = selector.locator('.ant-select-selection-item-content');
    await expect(selectedItems).toHaveCount(2);
    await expect(selectedItems.first()).toHaveText('Option 1');
    await expect(selectedItems.last()).toHaveText('Option 3');
  });

  test('can deselect option by clicking again', async ({ page }) => {
    const selector = getSelector(page, 'ms_with_value');

    // Initial state has Option 2 and Option 3 selected
    await expect(selector.locator('.ant-select-selection-item-content')).toHaveCount(2);

    await selector.click();
    // Deselect Option 2 (index 1)
    await getOption(page, 'ms_with_value', 1).click();
    await page.keyboard.press('Escape');

    // Should now only have Option 3
    const selectedItems = selector.locator('.ant-select-selection-item-content');
    await expect(selectedItems).toHaveCount(1);
    await expect(selectedItems.first()).toHaveText('Option 3');
  });

  test('can remove selection by clicking tag remove button', async ({ page }) => {
    const selector = getSelector(page, 'ms_with_value');

    // Initial state has Option 2 and Option 3 selected
    const removeButtons = selector.locator('.ant-select-selection-item-remove');
    await expect(removeButtons).toHaveCount(2);

    // Click first remove button
    await removeButtons.first().click();

    // Should now only have one item
    await expect(selector.locator('.ant-select-selection-item-content')).toHaveCount(1);
  });

  test('can clear all selections with clear button', async ({ page }) => {
    const selector = getSelector(page, 'ms_clearable');

    // Select some options first (note: 'B' is pre-selected via onInit state)
    await selector.click();
    await getOption(page, 'ms_clearable', 0).click();
    // Wait for selection to be confirmed
    await expect(getOption(page, 'ms_clearable', 0)).toHaveClass(/ant-select-item-option-selected/);
    await getOption(page, 'ms_clearable', 2).click();
    // Wait for selection to be confirmed
    await expect(getOption(page, 'ms_clearable', 2)).toHaveClass(/ant-select-item-option-selected/);
    await page.keyboard.press('Escape');

    // Verify selections (A, B from state, C = 3 items)
    await expect(selector.locator('.ant-select-selection-item-content')).toHaveCount(3);

    // Clear all
    await selector.hover();
    const clearBtn = selector.locator('.ant-select-clear');
    await clearBtn.click();

    // Verify cleared - placeholder should be visible
    await expect(selector.locator('.ant-select-selection-placeholder')).toBeVisible();
  });

  test('can filter options by typing', async ({ page }) => {
    const selector = getSelector(page, 'ms_searchable');
    await selector.click();

    await page.keyboard.type('Bl');

    // Only Blueberry should be visible (index 3)
    await expect(getOption(page, 'ms_searchable', 3)).toBeVisible();
    await expect(getOption(page, 'ms_searchable', 3)).toHaveText('Blueberry');
    await expect(getOption(page, 'ms_searchable', 0)).not.toBeVisible(); // Apple hidden
  });

  test('cannot select disabled option', async ({ page }) => {
    const selector = getSelector(page, 'ms_disabled_option');
    await selector.click();

    // Try to click disabled option (index 1)
    await getOption(page, 'ms_disabled_option', 1).click();

    // Dropdown should still be open (option not selected)
    const dropdown = page.locator('.ant-select-dropdown');
    await expect(dropdown).toBeVisible();

    // No value should be selected
    await expect(selector.locator('.ant-select-selection-placeholder')).toBeVisible();
  });
});
