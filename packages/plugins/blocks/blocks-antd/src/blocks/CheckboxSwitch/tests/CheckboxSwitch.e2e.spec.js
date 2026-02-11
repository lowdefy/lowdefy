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

// Helper to get the checkbox input element
const getCheckbox = (page, blockId) => page.locator(`#${blockId}_input`);

// Helper to get the checkbox wrapper (for clicking)
const getCheckboxWrapper = (page, blockId) => page.locator(`#bl-${blockId} .ant-checkbox-wrapper`);

test.describe('CheckboxSwitch Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'checkboxswitch');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with label', async ({ page }) => {
    const block = getBlock(page, 'checkboxswitch_basic');
    await expect(block).toBeVisible();
    const label = block.locator('label').first();
    await expect(label).toContainText('Basic Checkbox');
  });

  test('renders checkbox element', async ({ page }) => {
    const checkbox = getCheckbox(page, 'checkboxswitch_basic');
    await expect(checkbox).toBeVisible();
  });

  test('renders unchecked by default', async ({ page }) => {
    const checkbox = getCheckbox(page, 'checkboxswitch_basic');
    await expect(checkbox).not.toBeChecked();
  });

  test('renders checked when value is true', async ({ page }) => {
    const checkbox = getCheckbox(page, 'checkboxswitch_checked');
    await expect(checkbox).toBeChecked();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const checkbox = getCheckbox(page, 'checkboxswitch_disabled');
    await expect(checkbox).toBeDisabled();
    await expect(checkbox).not.toBeChecked();
  });

  test('renders with description text', async ({ page }) => {
    const wrapper = getCheckboxWrapper(page, 'checkboxswitch_with_description');
    await expect(wrapper).toContainText('I agree to the terms and conditions');
  });

  test('renders HTML description', async ({ page }) => {
    const wrapper = getCheckboxWrapper(page, 'checkboxswitch_html_description');
    const bold = wrapper.locator('strong');
    const italic = wrapper.locator('em');
    await expect(bold).toHaveText('Bold');
    await expect(italic).toHaveText('italic');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when checkbox is checked', async ({ page }) => {
    const wrapper = getCheckboxWrapper(page, 'checkboxswitch_onchange');

    // Click to check
    await wrapper.click();

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: true');
  });

  test('onChange event fires with false when unchecked', async ({ page }) => {
    const wrapper = getCheckboxWrapper(page, 'checkboxswitch_onchange');

    // Click to check, then uncheck
    await wrapper.click();
    await wrapper.click();

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Value: false');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can check checkbox by clicking', async ({ page }) => {
    const wrapper = getCheckboxWrapper(page, 'checkboxswitch_toggle');
    const checkbox = getCheckbox(page, 'checkboxswitch_toggle');

    // Should be unchecked initially
    await expect(checkbox).not.toBeChecked();

    // Click to check
    await wrapper.click();

    // Should now be checked
    await expect(checkbox).toBeChecked();

    const display = getBlock(page, 'toggle_display');
    await expect(display).toHaveText('Checkbox is CHECKED');
  });

  test('can uncheck checkbox by clicking', async ({ page }) => {
    const wrapper = getCheckboxWrapper(page, 'checkboxswitch_toggle');
    const checkbox = getCheckbox(page, 'checkboxswitch_toggle');

    // Check first
    await wrapper.click();
    await expect(checkbox).toBeChecked();

    // Uncheck
    await wrapper.click();
    await expect(checkbox).not.toBeChecked();

    const display = getBlock(page, 'toggle_display');
    await expect(display).toHaveText('Checkbox is UNCHECKED');
  });

  test('can check by clicking description text', async ({ page }) => {
    const wrapper = getCheckboxWrapper(page, 'checkboxswitch_with_description');
    const checkbox = getCheckbox(page, 'checkboxswitch_with_description');

    // Click on the description text
    await wrapper.locator('text=I agree to the terms').click();

    // Should be checked
    await expect(checkbox).toBeChecked();
  });

  test('cannot toggle disabled checkbox', async ({ page }) => {
    const wrapper = getCheckboxWrapper(page, 'checkboxswitch_disabled');
    const checkbox = getCheckbox(page, 'checkboxswitch_disabled');

    // Try to click
    await wrapper.click({ force: true });

    // Should still be unchecked and disabled
    await expect(checkbox).toBeDisabled();
    await expect(checkbox).not.toBeChecked();
  });
});
