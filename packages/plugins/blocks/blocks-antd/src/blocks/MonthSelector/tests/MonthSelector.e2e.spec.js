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

// Helper to get the month input
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

// Helper to get the picker wrapper (use framework wrapper ID bl-{blockId})
const getPicker = (page, blockId) => page.locator(`#bl-${blockId} .ant-picker`);

test.describe('MonthSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'monthselector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with default placeholder', async ({ page }) => {
    const input = getInput(page, 'ms_basic');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Select Month');
  });

  test('can display selected month value', async ({ page }) => {
    const input = getInput(page, 'ms_with_value');
    await input.click();

    // Select a month
    const monthCell = page.locator('.ant-picker-cell-in-view').first();
    await monthCell.click();

    // Input should have a value now (format YYYY-MM)
    await expect(input).toHaveValue(/\d{4}-\d{2}/);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'ms_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const picker = getPicker(page, 'ms_small');
    await expect(picker).toHaveClass(/ant-picker-small/);
  });

  test('renders large size', async ({ page }) => {
    const picker = getPicker(page, 'ms_large');
    await expect(picker).toHaveClass(/ant-picker-large/);
  });

  test('renders with custom placeholder', async ({ page }) => {
    const input = getInput(page, 'ms_placeholder');
    await expect(input).toHaveAttribute('placeholder', 'Pick a month...');
  });

  test('renders borderless style', async ({ page }) => {
    const picker = getPicker(page, 'ms_borderless');
    await expect(picker).toHaveClass(/ant-picker-borderless/);
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'ms_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Month with Title/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'ms_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Month Label/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Select a month from the calendar');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when month selected', async ({ page }) => {
    const input = getInput(page, 'ms_onchange');
    await input.click();

    // Wait for picker dropdown to appear
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    // Click a month cell (current month)
    const monthCell = page.locator('.ant-picker-cell-in-view').first();
    await monthCell.click();

    const display = getBlock(page, 'ms_onchange_display');
    await expect(display).toHaveText('Month selected');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can open month picker dropdown', async ({ page }) => {
    const input = getInput(page, 'ms_interaction');
    await input.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();
  });

  test('shows month panel in dropdown', async ({ page }) => {
    const input = getInput(page, 'ms_interaction');
    await input.click();

    // Month picker shows month panel (not date panel)
    const monthPanel = page.locator('.ant-picker-month-panel:visible');
    await expect(monthPanel).toBeVisible();
  });

  test('can select a month from panel', async ({ page }) => {
    const input = getInput(page, 'ms_interaction');
    await input.click();

    // Click a month
    const monthCell = page.locator('.ant-picker-cell-in-view').first();
    await monthCell.click();

    // Input should have a value now
    await expect(input).not.toHaveValue('');
  });

  test('can clear value with clear button', async ({ page }) => {
    const picker = getPicker(page, 'ms_clearable');
    const input = getInput(page, 'ms_clearable');

    // First select a month
    await input.click();
    const monthCell = page.locator('.ant-picker-cell-in-view').first();
    await monthCell.click();
    await expect(input).not.toHaveValue('');

    // Hover to reveal clear button and clear
    await picker.hover();
    const clearBtn = picker.locator('.ant-picker-clear');
    await clearBtn.click();

    await expect(input).toHaveValue('');
  });

  test('hides clear button when allowClear is false', async ({ page }) => {
    const picker = getPicker(page, 'ms_no_allowclear');
    const input = getInput(page, 'ms_no_allowclear');

    // Select a month first
    await input.click();
    const monthCell = page.locator('.ant-picker-cell-in-view').first();
    await monthCell.click();

    // Hover - clear button should not be visible
    await picker.hover();
    await expect(picker.locator('.ant-picker-clear')).not.toBeVisible();
  });

  test('closes dropdown on Escape', async ({ page }) => {
    const input = getInput(page, 'ms_interaction');
    await input.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
  });
});
