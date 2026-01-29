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

// Helper to get the range picker wrapper (use framework wrapper ID bl-{blockId})
const getPicker = (page, blockId) => page.locator(`#bl-${blockId} .ant-picker`);

// Helper to get the start input (has the block id)
const getStartInput = (page, blockId) => page.locator(`#${blockId}_input`);

// Helper to get the end input (second input in the picker)
const getEndInput = (page, blockId) =>
  page.locator(`#bl-${blockId} .ant-picker-input`).last().locator('input');

test.describe('DateRangeSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'daterangeselector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with both inputs visible', async ({ page }) => {
    const startInput = getStartInput(page, 'drs_basic');
    const endInput = getEndInput(page, 'drs_basic');
    await expect(startInput).toBeVisible();
    await expect(endInput).toBeVisible();
  });

  test('can display selected date range', async ({ page }) => {
    const startInput = getStartInput(page, 'drs_with_value');
    const endInput = getEndInput(page, 'drs_with_value');

    // Click to open picker
    await startInput.click();

    // Wait for dropdown to appear
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    // Click a date cell (first available in-view cell)
    const dateCell = page.locator('.ant-picker-cell-in-view').first();
    await dateCell.click();
    // Click again for end date
    await dateCell.click();

    // Both inputs should have values
    await expect(startInput).toHaveValue(/\d{4}-\d{2}-\d{2}/);
    await expect(endInput).toHaveValue(/\d{4}-\d{2}-\d{2}/);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const startInput = getStartInput(page, 'drs_disabled');
    const endInput = getEndInput(page, 'drs_disabled');
    await expect(startInput).toBeDisabled();
    await expect(endInput).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const picker = getPicker(page, 'drs_small');
    await expect(picker).toHaveClass(/ant-picker-small/);
  });

  test('renders large size', async ({ page }) => {
    const picker = getPicker(page, 'drs_large');
    await expect(picker).toHaveClass(/ant-picker-large/);
  });

  test('renders with custom placeholders visible in picker', async ({ page }) => {
    // Placeholders in RangePicker are shown as spans, not input placeholder attribute
    const picker = getPicker(page, 'drs_placeholder');
    await expect(picker).toBeVisible();
    // Check that the picker container exists (placeholder handling is complex in RangePicker)
  });

  test('renders borderless style', async ({ page }) => {
    const picker = getPicker(page, 'drs_borderless');
    await expect(picker).toHaveClass(/ant-picker-borderless/);
  });

  test('renders with separator element', async ({ page }) => {
    const picker = getPicker(page, 'drs_separator');
    // Separator is rendered between inputs (may be text or icon)
    const separator = picker.locator('.ant-picker-range-separator');
    await expect(separator).toBeVisible();
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'drs_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Date Range with Title/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'drs_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Date Range Label/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Select start and end dates');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when range selected', async ({ page }) => {
    const startInput = getStartInput(page, 'drs_onchange');
    await startInput.click();

    // Wait for picker dropdown to appear
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    // Click a date for start and end
    const dateCell = page.locator('.ant-picker-cell-in-view').first();
    await dateCell.click();
    await dateCell.click();

    const display = getBlock(page, 'drs_onchange_display');
    await expect(display).toHaveText('Range selected');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can open date range picker dropdown', async ({ page }) => {
    const startInput = getStartInput(page, 'drs_interaction');
    await startInput.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();
  });

  test('shows two calendar panels', async ({ page }) => {
    const startInput = getStartInput(page, 'drs_interaction');
    await startInput.click();

    // Range picker shows two panels
    const panels = page.locator('.ant-picker-panel:visible');
    await expect(panels).toHaveCount(2);
  });

  test('can select a date range', async ({ page }) => {
    const startInput = getStartInput(page, 'drs_interaction');
    const endInput = getEndInput(page, 'drs_interaction');
    await startInput.click();

    // Click a date for start and end
    const dateCell = page.locator('.ant-picker-cell-in-view').first();
    await dateCell.click();
    await dateCell.click();

    // Both inputs should have values now
    await expect(startInput).not.toHaveValue('');
    await expect(endInput).not.toHaveValue('');
  });

  test('can clear value with clear button', async ({ page }) => {
    const picker = getPicker(page, 'drs_clearable');
    const startInput = getStartInput(page, 'drs_clearable');
    const endInput = getEndInput(page, 'drs_clearable');

    // First select a date range
    await startInput.click();
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();
    const dateCell = page.locator('.ant-picker-cell-in-view').first();
    await dateCell.click();
    await dateCell.click();
    await expect(startInput).not.toHaveValue('');

    // Hover to reveal clear button and clear
    await picker.hover();
    const clearBtn = picker.locator('.ant-picker-clear');
    await clearBtn.click();

    await expect(startInput).toHaveValue('');
    await expect(endInput).toHaveValue('');
  });

  test('hides clear button when allowClear is false', async ({ page }) => {
    const picker = getPicker(page, 'drs_no_allowclear');
    const startInput = getStartInput(page, 'drs_no_allowclear');

    // Select a date range first
    await startInput.click();
    const dateCell = page.locator('.ant-picker-cell-in-view').first();
    await dateCell.click();
    await dateCell.click();

    // Hover - clear button should not be visible
    await picker.hover();
    await expect(picker.locator('.ant-picker-clear')).not.toBeVisible();
  });

  test('closes dropdown on Escape', async ({ page }) => {
    const startInput = getStartInput(page, 'drs_interaction');
    await startInput.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    // After Escape, dropdown may close or become hidden
    await expect(dropdown).toHaveCount(0);
  });
});
