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

// Helper to get the datetime input
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

// Helper to get the picker wrapper (use framework wrapper ID bl-{blockId})
const getPicker = (page, blockId) => page.locator(`#bl-${blockId} .ant-picker`);

test.describe('DateTimeSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'datetimeselector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with default placeholder', async ({ page }) => {
    const input = getInput(page, 'dts_basic');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Select Date & Time');
  });

  test('can display selected datetime value', async ({ page }) => {
    const input = getInput(page, 'dts_with_value');
    await input.click();

    // Select a date
    await page.locator('.ant-picker-cell-in-view').first().click();

    // Input should have a value now (format YYYY-MM-DD HH:mm)
    await expect(input).toHaveValue(/\d{4}-\d{2}-\d{2}/);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'dts_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const picker = getPicker(page, 'dts_small');
    await expect(picker).toHaveClass(/ant-picker-small/);
  });

  test('renders large size', async ({ page }) => {
    const picker = getPicker(page, 'dts_large');
    await expect(picker).toHaveClass(/ant-picker-large/);
  });

  test('renders with custom placeholder', async ({ page }) => {
    const input = getInput(page, 'dts_placeholder');
    await expect(input).toHaveAttribute('placeholder', 'Pick date and time...');
  });

  test('renders borderless style', async ({ page }) => {
    const picker = getPicker(page, 'dts_borderless');
    await expect(picker).toHaveClass(/ant-picker-borderless/);
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'dts_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/DateTime with Title/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'dts_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/DateTime Label/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Select date and time');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when datetime selected', async ({ page }) => {
    const input = getInput(page, 'dts_onchange');
    await input.click();

    // Wait for picker dropdown to appear
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    // Click a date cell - this triggers onChange via onSelect
    await page.locator('.ant-picker-cell-in-view').first().click();

    const display = getBlock(page, 'dts_onchange_display');
    await expect(display).toHaveText('DateTime selected');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can open datetime picker dropdown', async ({ page }) => {
    const input = getInput(page, 'dts_interaction');
    await input.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();
  });

  test('shows time panel in dropdown', async ({ page }) => {
    const input = getInput(page, 'dts_interaction');
    await input.click();

    // DateTime picker should show time panel
    const timePanel = page.locator('.ant-picker-time-panel:visible');
    await expect(timePanel).toBeVisible();
  });

  test('can select a date from calendar', async ({ page }) => {
    const input = getInput(page, 'dts_interaction');
    await input.click();

    // Click a date cell
    await page.locator('.ant-picker-cell-in-view').first().click();

    // Input should have a value now
    await expect(input).not.toHaveValue('');
  });

  test('can clear value with clear button', async ({ page }) => {
    const picker = getPicker(page, 'dts_clearable');
    const input = getInput(page, 'dts_clearable');

    // First select a datetime
    await input.click();
    await page.locator('.ant-picker-cell-in-view').first().click();
    await expect(input).not.toHaveValue('');

    // Hover to reveal clear button and clear
    await picker.hover();
    const clearBtn = picker.locator('.ant-picker-clear');
    await clearBtn.click();

    await expect(input).toHaveValue('');
  });

  test('hides clear button when allowClear is false', async ({ page }) => {
    const picker = getPicker(page, 'dts_no_allowclear');
    const input = getInput(page, 'dts_no_allowclear');

    // Select a date first
    await input.click();
    await page.locator('.ant-picker-cell-in-view').first().click();

    // Hover - clear button should not be visible
    await picker.hover();
    await expect(picker.locator('.ant-picker-clear')).toBeHidden();
  });

  test('closes dropdown on Escape', async ({ page }) => {
    const input = getInput(page, 'dts_interaction');
    await input.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
  });
});
