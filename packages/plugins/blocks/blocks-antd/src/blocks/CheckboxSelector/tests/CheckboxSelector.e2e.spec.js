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

// Helper to get a checkbox option by index (options have id={blockId}_{index})
const getCheckbox = (page, blockId, index) => page.locator(`#${blockId}_${index}`);

// Helper to get the checkbox group
const getCheckboxGroup = (page, blockId) => page.locator(`#${blockId}_input`);

test.describe('CheckboxSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'checkbox_selector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with options visible', async ({ page }) => {
    const group = getCheckboxGroup(page, 'cs_basic');
    await expect(group).toBeVisible();

    // All three options should be visible
    await expect(getCheckbox(page, 'cs_basic', 0)).toBeVisible();
    await expect(getCheckbox(page, 'cs_basic', 1)).toBeVisible();
    await expect(getCheckbox(page, 'cs_basic', 2)).toBeVisible();
  });

  test('renders with initial values checked', async ({ page }) => {
    // Options 2 and 3 should be checked (indices 1 and 2)
    const checkbox1 = getCheckbox(page, 'cs_with_value', 1);
    const checkbox2 = getCheckbox(page, 'cs_with_value', 2);

    await expect(checkbox1).toBeChecked();
    await expect(checkbox2).toBeChecked();

    // Option 1 should not be checked
    const checkbox0 = getCheckbox(page, 'cs_with_value', 0);
    await expect(checkbox0).not.toBeChecked();
  });

  test('renders option labels correctly', async ({ page }) => {
    const option1 = page.locator('label:has(#cs_basic_0)');
    const option2 = page.locator('label:has(#cs_basic_1)');
    const option3 = page.locator('label:has(#cs_basic_2)');

    await expect(option1).toHaveText('Option 1');
    await expect(option2).toHaveText('Option 2');
    await expect(option3).toHaveText('Option 3');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const group = getCheckboxGroup(page, 'cs_disabled');
    await expect(group).toHaveClass(/ant-checkbox-group/);

    // Check that checkboxes are disabled
    const checkbox = getCheckbox(page, 'cs_disabled', 0);
    await expect(checkbox).toBeDisabled();
  });

  test('renders vertical direction', async ({ page }) => {
    const group = getCheckboxGroup(page, 'cs_vertical');
    const space = group.locator('.ant-space');
    await expect(space).toHaveClass(/ant-space-vertical/);
  });

  test('renders horizontal direction', async ({ page }) => {
    const group = getCheckboxGroup(page, 'cs_horizontal');
    const space = group.locator('.ant-space');
    await expect(space).toHaveClass(/ant-space-horizontal/);
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'cs_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Select your options/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'cs_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Choose items/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Select one or more');
  });

  // ============================================
  // OPTIONS TESTS
  // ============================================

  test('renders object options with labels', async ({ page }) => {
    const option1 = page.locator('label:has(#cs_object_options_0)');
    const option2 = page.locator('label:has(#cs_object_options_1)');
    const option3 = page.locator('label:has(#cs_object_options_2)');

    await expect(option1).toHaveText('First Option');
    await expect(option2).toHaveText('Second Option');
    await expect(option3).toHaveText('Third Option');
  });

  test('renders disabled option correctly', async ({ page }) => {
    const enabledCheckbox = getCheckbox(page, 'cs_disabled_option', 0);
    const disabledCheckbox = getCheckbox(page, 'cs_disabled_option', 1);
    const anotherEnabled = getCheckbox(page, 'cs_disabled_option', 2);

    await expect(enabledCheckbox).toBeEnabled();
    await expect(disabledCheckbox).toBeDisabled();
    await expect(anotherEnabled).toBeEnabled();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when option checked', async ({ page }) => {
    const checkbox = getCheckbox(page, 'cs_onchange', 1);
    await checkbox.click();

    const display = getBlock(page, 'cs_onchange_display');
    await expect(display).toContainText('Selected:');
    await expect(display).toContainText('"Banana"');
  });

  test('onChange event fires with multiple selections', async ({ page }) => {
    await getCheckbox(page, 'cs_onchange', 0).click();
    await getCheckbox(page, 'cs_onchange', 2).click();

    const display = getBlock(page, 'cs_onchange_display');
    await expect(display).toContainText('Selected:');
    await expect(display).toContainText('"Apple"');
    await expect(display).toContainText('"Cherry"');
  });

  test('onChange event fires when option unchecked', async ({ page }) => {
    // Check two options first
    await getCheckbox(page, 'cs_onchange', 0).click();
    await getCheckbox(page, 'cs_onchange', 1).click();

    const display = getBlock(page, 'cs_onchange_display');
    await expect(display).toContainText('"Apple"');
    await expect(display).toContainText('"Banana"');

    // Uncheck one
    await getCheckbox(page, 'cs_onchange', 0).click();
    await expect(display).toContainText('"Banana"');
    await expect(display).not.toContainText('"Apple"');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can check option by clicking', async ({ page }) => {
    const checkbox = getCheckbox(page, 'cs_interaction', 0);
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('can uncheck option by clicking again', async ({ page }) => {
    const checkbox = getCheckbox(page, 'cs_interaction', 0);

    await checkbox.click();
    await expect(checkbox).toBeChecked();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('can check multiple options', async ({ page }) => {
    await getCheckbox(page, 'cs_interaction', 0).click();
    await getCheckbox(page, 'cs_interaction', 1).click();
    await getCheckbox(page, 'cs_interaction', 3).click();

    await expect(getCheckbox(page, 'cs_interaction', 0)).toBeChecked();
    await expect(getCheckbox(page, 'cs_interaction', 1)).toBeChecked();
    await expect(getCheckbox(page, 'cs_interaction', 2)).not.toBeChecked();
    await expect(getCheckbox(page, 'cs_interaction', 3)).toBeChecked();
  });

  test('can click on label to toggle checkbox', async ({ page }) => {
    const label = page.locator('label:has(#cs_interaction_0)');
    const checkbox = getCheckbox(page, 'cs_interaction', 0);

    await expect(checkbox).not.toBeChecked();
    await label.click();
    await expect(checkbox).toBeChecked();
  });

  test('cannot interact with disabled checkbox', async ({ page }) => {
    const checkbox = getCheckbox(page, 'cs_disabled', 0);
    await expect(checkbox).not.toBeChecked();

    // Try to click
    await checkbox.click({ force: true });

    // Should still be unchecked
    await expect(checkbox).not.toBeChecked();
  });

  test('cannot check disabled option in mixed group', async ({ page }) => {
    const disabledCheckbox = getCheckbox(page, 'cs_disabled_option', 1);
    await expect(disabledCheckbox).not.toBeChecked();

    // Try to click
    await disabledCheckbox.click({ force: true });

    // Should still be unchecked
    await expect(disabledCheckbox).not.toBeChecked();
  });
});
