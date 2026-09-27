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

import dateSelector from '../e2e.js';

// Helper to get the date input
const getInput = (page, blockId) => page.locator(`#${escapeId(blockId)}_input`);

// Helper to get the picker wrapper (use framework wrapper ID bl-{blockId})
const getPicker = (page, blockId) => page.locator(`#bl-${escapeId(blockId)} .ant-picker`);

test.describe('DateSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'dateselector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders with default placeholder', async ({ page }) => {
    const input = getInput(page, 'ds_basic');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Select date');
  });

  test('can display selected date value', async ({ page }) => {
    const input = getInput(page, 'ds_with_value');
    await input.click();

    // Select a date
    await page.locator('.ant-picker-cell-in-view').first().click();

    // Input should have a value now (format YYYY-MM-DD)
    await expect(input).toHaveValue(/\d{4}-\d{2}-\d{2}/);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const input = getInput(page, 'ds_disabled');
    await expect(input).toBeDisabled();
  });

  test('renders small size', async ({ page }) => {
    const picker = getPicker(page, 'ds_small');
    await expect(picker).toHaveClass(/ant-picker-small/);
  });

  test('renders large size', async ({ page }) => {
    const picker = getPicker(page, 'ds_large');
    await expect(picker).toHaveClass(/ant-picker-large/);
  });

  test('renders with custom placeholder', async ({ page }) => {
    const input = getInput(page, 'ds_placeholder');
    await expect(input).toHaveAttribute('placeholder', 'Pick a date...');
  });

  test('renders borderless style', async ({ page }) => {
    const picker = getPicker(page, 'ds_borderless');
    await expect(picker).toHaveClass(/ant-picker-borderless/);
  });

  test('renders with title', async ({ page }) => {
    const block = getBlock(page, 'ds_with_title');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Date with Title/);
  });

  test('renders with label properties', async ({ page }) => {
    const block = getBlock(page, 'ds_with_label');
    const label = block.locator('.ant-form-item-label');
    await expect(label).toHaveText(/Date Label/);

    const extra = block.locator('.ant-form-item-extra');
    await expect(extra).toHaveText('Select a date from the calendar');
  });

  // ============================================
  // DISABLED DATES TESTS
  // ============================================

  test('renders with disabledDates min/max without errors', async ({ page }) => {
    // This test catches dayjs plugin issues — disabledDate callback receives
    // antd's internal dayjs instances and calls .utc() on them.
    const input = getInput(page, 'ds_disabled_dates_min_max');
    await expect(input).toBeVisible();

    // Open the picker to trigger disabledDate calls on all visible cells
    await input.click();
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    // Verify disabled cells exist (dates outside Jun 2024 range)
    const disabledCells = dropdown.locator('.ant-picker-cell-disabled');
    await expect(disabledCells.first()).toBeVisible();
  });

  test('renders with specific disabled dates without errors', async ({ page }) => {
    const input = getInput(page, 'ds_disabled_specific_dates');
    await expect(input).toBeVisible();

    // Open picker to trigger disabledDate on all visible cells
    await input.click();
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when date selected', async ({ page }) => {
    const input = getInput(page, 'ds_onchange');
    await input.click();

    // Wait for picker dropdown to appear
    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    // Click a date cell
    await page.locator('.ant-picker-cell-in-view').first().click();

    const display = getBlock(page, 'ds_onchange_display');
    await expect(display).toHaveText('Date selected');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can open date picker dropdown', async ({ page }) => {
    const input = getInput(page, 'ds_interaction');
    await input.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();
  });

  test('can select a date from calendar', async ({ page }) => {
    const input = getInput(page, 'ds_interaction');
    await input.click();

    // Click a date cell
    await page.locator('.ant-picker-cell-in-view').first().click();

    // Input should have a value now
    await expect(input).not.toHaveValue('');
  });

  test('can clear value with clear button', async ({ page }) => {
    const picker = getPicker(page, 'ds_clearable');
    const input = getInput(page, 'ds_clearable');

    // First select a date
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
    const picker = getPicker(page, 'ds_no_allowclear');
    const input = getInput(page, 'ds_no_allowclear');

    // Type a value first by selecting a date
    await input.click();
    await page.locator('.ant-picker-cell-in-view').first().click();

    // Hover - clear button should not be visible
    await picker.hover();
    await expect(picker.locator('.ant-picker-clear')).toBeHidden();
  });

  test('closes dropdown on Escape', async ({ page }) => {
    const input = getInput(page, 'ds_interaction');
    await input.click();

    const dropdown = page.locator('.ant-picker-dropdown:visible');
    await expect(dropdown).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dropdown).toBeHidden();
  });
});

// Pinned to a negative UTC offset: preset dates are read as UTC wall clocks, and a naive
// conversion of a _date object would land a day early in timezones behind UTC.
test.describe('DateSelector Block presets', () => {
  test.use({ timezoneId: 'America/New_York' });

  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'dateselector');
  });

  test('lists presets next to the calendar', async ({ page }) => {
    await dateSelector.do.open(page, 'ds_presets');

    await dateSelector.expect.presetLabels(page, 'ds_presets', ['New Year 2024', 'Mid 2024']);
  });

  test('selects the date of a preset given as a date string', async ({ page }) => {
    await dateSelector.do.selectPreset(page, 'ds_presets', 'New Year 2024');

    await dateSelector.expect.closed(page, 'ds_presets');
    await dateSelector.expect.value(page, 'ds_presets', '2024-01-01');
  });

  test('selects the date of a preset given as a _date object', async ({ page }) => {
    await dateSelector.do.selectPreset(page, 'ds_presets', 'Mid 2024');

    await dateSelector.expect.closed(page, 'ds_presets');
    await dateSelector.expect.value(page, 'ds_presets', '2024-06-15');
  });
});

// Pinned to a positive UTC offset and to a moment where the local and UTC calendar dates differ:
// 21:30 UTC on 30 June is 09:30 on 1 July in Auckland. A relative preset that resolves to an
// instant instead of a local calendar date selects 30 June here.
test.describe('DateSelector Block presets in a timezone ahead of UTC', () => {
  test.use({ timezoneId: 'Pacific/Auckland' });

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-30T21:30:00.000Z'));
    await navigateToTestPage(page, 'dateselector');
  });

  test('selects the local date for a relative preset', async ({ page }) => {
    await dateSelector.do.selectPreset(page, 'ds_presets_today', 'Today');

    await dateSelector.expect.closed(page, 'ds_presets_today');
    await dateSelector.expect.value(page, 'ds_presets_today', '2026-07-01');
  });
});

// Pinned to a fixed clock so "now" based presets and disabledDates resolve to known dates, in a
// timezone where the local and UTC calendar dates agree so the test is only about disabledDates.
test.describe('DateSelector Block presets and disabledDates', () => {
  test.use({ timezoneId: 'America/New_York' });

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-07-15T12:00:00.000Z'));
    await navigateToTestPage(page, 'dateselector');
  });

  // A single date cannot be narrowed to a date it may select, so it is only ever disabled.
  test('disables a preset whose date the calendar disables', async ({ page }) => {
    await dateSelector.do.open(page, 'ds_presets_min_now');

    await dateSelector.expect.presetDisabled(page, 'ds_presets_min_now', 'A Week Ago');
  });

  test('leaves a preset inside the allowed dates selectable', async ({ page }) => {
    await dateSelector.do.open(page, 'ds_presets_min_now');
    await dateSelector.expect.presetEnabled(page, 'ds_presets_min_now', 'Today');

    await dateSelector.do.selectPreset(page, 'ds_presets_min_now', 'Today');
    await dateSelector.expect.closed(page, 'ds_presets_min_now');
    await dateSelector.expect.value(page, 'ds_presets_min_now', '2026-07-15');
  });
});

// disabledDates.ranges accepts a { from, to } object and an array of the two dates.
test.describe('DateSelector Block disabledDates ranges', () => {
  test.use({ timezoneId: 'America/New_York' });

  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-03-17T12:00:00.000Z'));
    await navigateToTestPage(page, 'dateselector');
  });

  test('disables the dates of a range given as a from and to object', async ({ page }) => {
    await dateSelector.do.open(page, 'ds_disabled_ranges_from_to');

    await dateSelector.expect.dateDisabled(page, 'ds_disabled_ranges_from_to', '2026-03-10');
    await dateSelector.expect.dateDisabled(page, 'ds_disabled_ranges_from_to', '2026-03-12');
    await dateSelector.expect.dateDisabled(page, 'ds_disabled_ranges_from_to', '2026-03-14');
    await dateSelector.expect.dateEnabled(page, 'ds_disabled_ranges_from_to', '2026-03-09');
    await dateSelector.expect.dateEnabled(page, 'ds_disabled_ranges_from_to', '2026-03-15');
  });

  test('disables the dates of a range given as an array', async ({ page }) => {
    await dateSelector.do.open(page, 'ds_disabled_ranges_array');

    await dateSelector.expect.dateDisabled(page, 'ds_disabled_ranges_array', '2026-03-12');
    await dateSelector.expect.dateEnabled(page, 'ds_disabled_ranges_array', '2026-03-15');
  });

  test('disables a preset that falls inside a from and to range', async ({ page }) => {
    await dateSelector.do.open(page, 'ds_disabled_ranges_from_to');

    await dateSelector.expect.presetDisabled(
      page,
      'ds_disabled_ranges_from_to',
      'In the disabled range'
    );
    await dateSelector.expect.presetEnabled(
      page,
      'ds_disabled_ranges_from_to',
      'Outside the disabled range'
    );
  });
});

test.describe('DateSelector antd 6 features', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'dateselector');
  });

  const dropdown = (page, blockId) => page.locator(`#bl-${escapeId(blockId)} .ant-picker-dropdown`);

  test('renders the underlined variant', async ({ page }) => {
    await expect(getPicker(page, 'ds_underlined')).toHaveClass(/ant-picker-underlined/);
  });

  test('renders prefix text', async ({ page }) => {
    await expect(getPicker(page, 'ds_prefix_text').locator('.ant-picker-prefix')).toHaveText(
      'From'
    );
  });

  test('renders a prefix icon', async ({ page }) => {
    await expect(
      getPicker(page, 'ds_prefix_icon').locator('.ant-picker-prefix svg')
    ).toBeAttached();
  });

  test('inputReadOnly makes the text input read-only', async ({ page }) => {
    await expect(getInput(page, 'ds_readonly')).toHaveAttribute('readonly', '');
  });

  test('placement and the popup cssKey apply to the calendar popup', async ({ page }) => {
    await getPicker(page, 'ds_placement').click();
    const popup = dropdown(page, 'ds_placement');
    await expect(popup).toBeVisible();
    // The popup flips to the top when there is no room below, but keeps the right alignment.
    await expect(popup).toHaveClass(/ant-picker-dropdown-placement-(bottom|top)Right/);
    await expect(popup).toHaveClass(/ds-custom-popup/);
  });

  test('fires onFocus, onOpenChange and onBlur', async ({ page }) => {
    await getInput(page, 'ds_events').click();
    await expect(getBlock(page, 'ds_focus_display')).toHaveText('Focus: true');
    await expect(getBlock(page, 'ds_open_display')).toHaveText('Open: true');

    await page.keyboard.press('Escape');
    await expect(getBlock(page, 'ds_open_display')).toHaveText('Open: false');

    await getBlock(page, 'ds_underlined').click();
    await expect(getBlock(page, 'ds_blur_display')).toHaveText('Blur: true');
  });

  test('fires onClear when the clear button is clicked', async ({ page }) => {
    const picker = getPicker(page, 'ds_onclear');
    await expect(getInput(page, 'ds_onclear')).not.toHaveValue('');
    await picker.hover();
    await picker.locator('.ant-picker-clear').click();
    await expect(getInput(page, 'ds_onclear')).toHaveValue('');
    await expect(getBlock(page, 'ds_onclear_display')).toHaveText('Clear fired');
  });

  test('showWeek adds week numbers to the calendar', async ({ page }) => {
    await getPicker(page, 'ds_show_week').click();
    const popup = dropdown(page, 'ds_show_week');
    await expect(popup.locator('.ant-picker-date-panel-show-week').first()).toBeVisible();
    await expect(popup.locator('.ant-picker-cell-week').first()).toBeVisible();
  });
});

test.describe('DateSelector today button', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'dateselector');
  });

  test('shows the today button by default', async ({ page }) => {
    await getPicker(page, 'ds_basic').click();
    await expect(page.locator('#bl-ds_basic .ant-picker-now')).toHaveText('Today');
  });

  test('showToday false hides the today button', async ({ page }) => {
    await getPicker(page, 'ds_show_today_false').click();
    await expect(page.locator('#bl-ds_show_today_false .ant-picker-dropdown')).toBeVisible();
    await expect(page.locator('#bl-ds_show_today_false .ant-picker-now')).toHaveCount(0);
  });
});
