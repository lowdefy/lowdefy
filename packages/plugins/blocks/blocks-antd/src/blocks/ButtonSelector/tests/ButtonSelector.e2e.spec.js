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

// Helper to get the radio input by index (hidden, use for state checks)
const getButtonInput = (page, blockId, index) => page.locator(`#${blockId}_${index}`);

// Helper to get the clickable label wrapper by index
const getButtonLabel = (page, blockId, index) => page.locator(`label:has(#${blockId}_${index})`);

// Helper to get the button group wrapper
const getButtonGroup = (page, blockId) => page.locator(`#${blockId}_input`);

test.describe('ButtonSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'button_selector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with options visible as buttons', async ({ page }) => {
    const group = getButtonGroup(page, 'bs_basic');
    await expect(group).toBeVisible();

    // All three options should be visible as radio buttons (check labels, inputs are hidden)
    await expect(getButtonLabel(page, 'bs_basic', 0)).toBeVisible();
    await expect(getButtonLabel(page, 'bs_basic', 1)).toBeVisible();
    await expect(getButtonLabel(page, 'bs_basic', 2)).toBeVisible();
  });

  test('renders with initial value selected', async ({ page }) => {
    // Option 2 should be checked (index 1)
    await expect(getButtonInput(page, 'bs_with_value', 1)).toBeChecked();

    // Other options should not be checked
    await expect(getButtonInput(page, 'bs_with_value', 0)).not.toBeChecked();
    await expect(getButtonInput(page, 'bs_with_value', 2)).not.toBeChecked();
  });

  test('renders option labels correctly', async ({ page }) => {
    const label0 = page.locator('label:has(#bs_basic_0)');
    const label1 = page.locator('label:has(#bs_basic_1)');
    const label2 = page.locator('label:has(#bs_basic_2)');

    await expect(label0).toHaveText('Option 1');
    await expect(label1).toHaveText('Option 2');
    await expect(label2).toHaveText('Option 3');
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const button = getButtonInput(page, 'bs_disabled', 0);
    await expect(button).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const group = getButtonGroup(page, 'bs_small');
    await expect(group).toHaveClass(/ant-radio-group-small/);
  });

  test('renders large size', async ({ page }) => {
    const group = getButtonGroup(page, 'bs_large');
    await expect(group).toHaveClass(/ant-radio-group-large/);
  });

  test('renders solid button style', async ({ page }) => {
    const group = getButtonGroup(page, 'bs_solid');
    await expect(group).toHaveClass(/ant-radio-group-solid/);
  });

  test('renders outline button style', async ({ page }) => {
    const group = getButtonGroup(page, 'bs_outline');
    await expect(group).toHaveClass(/ant-radio-group-outline/);
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'bs_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Select an option/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'bs_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Choose one/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Click a button to select');
  });

  // ============================================
  // OPTIONS TESTS
  // ============================================

  test('renders object options with labels', async ({ page }) => {
    const label0 = page.locator('label:has(#bs_object_options_0)');
    const label1 = page.locator('label:has(#bs_object_options_1)');
    const label2 = page.locator('label:has(#bs_object_options_2)');

    await expect(label0).toHaveText('First Option');
    await expect(label1).toHaveText('Second Option');
    await expect(label2).toHaveText('Third Option');
  });

  test('renders disabled option correctly', async ({ page }) => {
    const enabledButton = getButtonInput(page, 'bs_disabled_option', 0);
    const disabledButton = getButtonInput(page, 'bs_disabled_option', 1);
    const anotherEnabled = getButtonInput(page, 'bs_disabled_option', 2);

    await expect(enabledButton).toBeEnabled();
    await expect(disabledButton).toBeDisabled();
    await expect(anotherEnabled).toBeEnabled();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when button clicked', async ({ page }) => {
    await getButtonLabel(page, 'bs_onchange', 1).click();

    const display = getBlock(page, 'bs_onchange_display');
    await expect(display).toHaveText('Selected: Banana');
  });

  test('onChange event fires when changing selection', async ({ page }) => {
    // Select first option
    await getButtonLabel(page, 'bs_onchange', 0).click();

    const display = getBlock(page, 'bs_onchange_display');
    await expect(display).toHaveText('Selected: Apple');

    // Change to another option
    await getButtonLabel(page, 'bs_onchange', 2).click();
    await expect(display).toHaveText('Selected: Cherry');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can select option by clicking button', async ({ page }) => {
    const input = getButtonInput(page, 'bs_interaction', 0);
    await expect(input).not.toBeChecked();

    await getButtonLabel(page, 'bs_interaction', 0).click();
    await expect(input).toBeChecked();
  });

  test('selecting one button deselects others', async ({ page }) => {
    // Select first option
    await getButtonLabel(page, 'bs_interaction', 0).click();
    await expect(getButtonInput(page, 'bs_interaction', 0)).toBeChecked();

    // Select second option
    await getButtonLabel(page, 'bs_interaction', 1).click();
    await expect(getButtonInput(page, 'bs_interaction', 1)).toBeChecked();
    await expect(getButtonInput(page, 'bs_interaction', 0)).not.toBeChecked();
  });

  test('clicking same button again keeps it selected', async ({ page }) => {
    const label = getButtonLabel(page, 'bs_interaction', 0);
    const input = getButtonInput(page, 'bs_interaction', 0);

    await label.click();
    await expect(input).toBeChecked();

    // Click again - should still be checked (radio buttons don't uncheck)
    await label.click();
    await expect(input).toBeChecked();
  });

  test('selected button has checked appearance', async ({ page }) => {
    const label = getButtonLabel(page, 'bs_interaction', 0);

    await label.click();

    // The label wrapper should have the checked class
    await expect(label).toHaveClass(/ant-radio-button-wrapper-checked/);
  });

  test('cannot interact with disabled buttons', async ({ page }) => {
    const input = getButtonInput(page, 'bs_disabled', 0);
    const label = getButtonLabel(page, 'bs_disabled', 0);
    await expect(input).not.toBeChecked();

    // Try to click the label (disabled button should not change state)
    await label.click({ force: true });

    // Should still be unchecked
    await expect(input).not.toBeChecked();
  });

  test('cannot select disabled option in mixed group', async ({ page }) => {
    const input = getButtonInput(page, 'bs_disabled_option', 1);
    const label = getButtonLabel(page, 'bs_disabled_option', 1);
    await expect(input).not.toBeChecked();

    // Try to click the label
    await label.click({ force: true });

    // Should still be unchecked
    await expect(input).not.toBeChecked();
  });

  test('can navigate buttons with keyboard', async ({ page }) => {
    // Click first button to focus the group
    await getButtonLabel(page, 'bs_interaction', 0).click();
    await expect(getButtonInput(page, 'bs_interaction', 0)).toBeChecked();

    // Press right arrow to move to next button
    await page.keyboard.press('ArrowRight');
    await expect(getButtonInput(page, 'bs_interaction', 1)).toBeChecked();
    await expect(getButtonInput(page, 'bs_interaction', 0)).not.toBeChecked();
  });
});
