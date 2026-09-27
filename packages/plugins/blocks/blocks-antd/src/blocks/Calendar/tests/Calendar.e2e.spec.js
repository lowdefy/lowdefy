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
import { escapeId } from '@lowdefy/e2e-utils';

const getCalendar = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('Calendar Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'calendar');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders full-size calendar', async ({ page }) => {
    const cal = getCalendar(page, 'cal_basic');
    await expect(cal).toBeVisible();
    await expect(cal.locator('.ant-picker-calendar')).toBeVisible();
  });

  test('renders compact calendar', async ({ page }) => {
    const cal = getCalendar(page, 'cal_compact');
    await expect(cal).toBeVisible();
    // Compact calendars don't have the fullscreen class
    await expect(cal.locator('.ant-picker-calendar-full')).toBeHidden();
  });

  test('renders with pre-set value', async ({ page }) => {
    const cal = getCalendar(page, 'cal_with_value');
    await expect(cal).toBeVisible();
    // Should have a selected cell
    await expect(cal.locator('.ant-picker-cell-selected')).toBeVisible();
  });

  // ============================================
  // DISABLED DATES
  // ============================================

  test('renders with disabledDates min/max without errors', async ({ page }) => {
    // This test catches dayjs plugin issues — disabledDate callback receives
    // antd's internal dayjs instances.
    const cal = getCalendar(page, 'cal_disabled_dates');
    await expect(cal).toBeVisible();

    // Should have disabled cells (dates outside the min/max range)
    const disabledCells = cal.locator('.ant-picker-cell-disabled');
    await expect(disabledCells.first()).toBeVisible();
  });

  test('renders with specific disabled dates without errors', async ({ page }) => {
    const cal = getCalendar(page, 'cal_disabled_specific');
    await expect(cal).toBeVisible();

    // Should have disabled cells for the specific dates
    const disabledCells = cal.locator('.ant-picker-cell-disabled');
    await expect(disabledCells.first()).toBeVisible();
  });

  // ============================================
  // DATE CELL DATA
  // ============================================

  test('renders badge data in date cells', async ({ page }) => {
    const cal = getCalendar(page, 'cal_cell_data');
    await expect(cal).toBeVisible();

    // Should render Badge components inside cells
    const badges = cal.locator('.ant-badge');
    await expect(badges.first()).toBeVisible();
  });

  test('month cells in year mode do not repeat the month name', async ({ page }) => {
    const cal = getCalendar(page, 'cal_year_cell_data');
    const firstMonth = cal.locator('td.ant-picker-cell').first();
    await expect(firstMonth.locator('.ant-picker-calendar-date-value')).toHaveText('Jan');
    await expect(firstMonth.locator('.ant-picker-calendar-date-content')).toHaveText('');
  });

  // ============================================
  // SHOW WEEK AND SEMANTIC KEYS
  // ============================================

  test('renders week numbers when showWeek is true', async ({ page }) => {
    const cal = getCalendar(page, 'cal_show_week');
    await expect(cal.locator('.ant-picker-date-panel')).toHaveClass(
      /ant-picker-date-panel-show-week/
    );
    await expect(cal.locator('.ant-picker-cell-week').first()).toBeVisible();
  });

  test('applies class and style to the semantic parts', async ({ page }) => {
    const cal = getCalendar(page, 'cal_css_keys');
    const header = cal.locator('.ant-picker-calendar-header');
    await expect(header).toHaveClass(/cal-header-class/);
    await expect(header).toHaveCSS('background-color', 'rgb(240, 248, 255)');
    await expect(cal.locator('td.ant-picker-cell').first()).toHaveClass(/cal-item-class/);
    await expect(cal.locator('.ant-picker-calendar-date-content').first()).toHaveClass(
      /cal-item-content-class/
    );
  });

  // ============================================
  // EVENTS
  // ============================================

  test('onSelect fires when date cell is clicked', async ({ page }) => {
    const cal = getCalendar(page, 'cal_onselect');
    await expect(cal).toBeVisible();

    // Click a date cell
    await cal.locator('.ant-picker-cell-in-view .ant-picker-cell-inner').first().click();

    // Display should show the selected date
    const display = getBlock(page, 'cal_selected_display');
    await expect(display).toHaveText(/\d{4}-\d{2}-\d{2}/);
  });

  test('onChange fires when date changes', async ({ page }) => {
    const cal = getCalendar(page, 'cal_onchange');
    await expect(cal).toBeVisible();

    // Click a date cell
    await cal.locator('.ant-picker-cell-in-view .ant-picker-cell-inner').first().click();

    // Display should show the changed date
    const display = getBlock(page, 'cal_changed_display');
    await expect(display).toHaveText(/\d{4}-\d{2}-\d{2}/);
  });
});
