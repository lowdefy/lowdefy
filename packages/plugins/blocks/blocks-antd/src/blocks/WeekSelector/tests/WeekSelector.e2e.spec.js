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

// Helper to get the week input
const getInput = (page, blockId) => page.locator(`#${blockId}_input`);

// Helper to get the picker wrapper (use framework wrapper ID bl-{blockId})
const getPicker = (page, blockId) => page.locator(`#bl-${blockId} .ant-picker`);

test.describe('WeekSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'weekselector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with default placeholder', async ({ page }) => {
    const input = getInput(page, 'ws_basic');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Select Week');
  });

  test('can display selected week value', async ({ page }) => {
    const input = getInput(page, 'ws_with_value');
    await input.click();

    // Select a week (click a date cell)
    await page.locator('.ant-picker-cell-in-view').first().click();

    // Input should have a value now (format YYYY-wo)
    await expect(input).toHaveValue(/\d{4}-/);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'ws_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const picker = getPicker(page, 'ws_small');
    await expect(picker).toHaveClass(/ant-picker-small/);
  });

  test('renders large size', async ({ page }) => {
    const picker = getPicker(page, 'ws_large');
    await expect(picker).toHaveClass(/ant-picker-large/);
  });

  test('renders with custom placeholder', async ({ page }) => {
    const input = getInput(page, 'ws_placeholder');
    await expect(input).toHaveAttribute('placeholder', 'Pick a week...');
  });

  test('renders borderless style', async ({ page }) => {
    const picker = getPicker(page, 'ws_borderless');
    await expect(picker).toHaveClass(/ant-picker-borderless/);
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'ws_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Week with Title/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'ws_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Week Label/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Select a week from the calendar');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when week selected', async ({ page }) => {
    const input = getInput(page, 'ws_onchange');
    await input.click();

    // Wait for picker dropdown to appear
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    // Click a date cell to select the week
    const dateCell = page.locator('.ant-picker-cell-in-view').first();
    await dateCell.click();

    const display = getBlock(page, 'ws_onchange_display');
    await expect(display).toHaveText('Week selected');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can open week picker dropdown', async ({ page }) => {
    const input = getInput(page, 'ws_interaction');
    await input.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();
  });

  test('shows week panel in dropdown', async ({ page }) => {
    const input = getInput(page, 'ws_interaction');
    await input.click();

    // Week picker shows week panel (date picker with week mode)
    const weekPanel = page.locator('.ant-picker-week-panel:visible');
    await expect(weekPanel).toBeVisible();
  });

  test('can select a week from panel', async ({ page }) => {
    const input = getInput(page, 'ws_interaction');
    await input.click();

    // Click a date cell to select that week
    const dateCell = page.locator('.ant-picker-cell-in-view').first();
    await dateCell.click();

    // Input should have a value now
    await expect(input).not.toHaveValue('');
  });

  test('can clear value with clear button', async ({ page }) => {
    const picker = getPicker(page, 'ws_clearable');
    const input = getInput(page, 'ws_clearable');

    // First select a week
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
    const picker = getPicker(page, 'ws_no_allowclear');
    const input = getInput(page, 'ws_no_allowclear');

    // Select a week first
    await input.click();
    const dateCell = page.locator('.ant-picker-cell-in-view').first();
    await dateCell.click();

    // Hover - clear button should not be visible
    await picker.hover();
    await expect(picker.locator('.ant-picker-clear')).toBeHidden();
  });

  test('closes dropdown on Escape', async ({ page }) => {
    const input = getInput(page, 'ws_interaction');
    await input.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
  });
});
