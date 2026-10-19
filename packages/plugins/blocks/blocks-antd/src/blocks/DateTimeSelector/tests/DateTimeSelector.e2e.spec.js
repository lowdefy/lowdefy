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

import dateTimeSelector from '../e2e.js';

// Helper to get the datetime input
const getInput = (page, blockId) => page.locator(`#${escapeId(blockId)}_input`);

// Helper to get the picker wrapper (use framework wrapper ID bl-{blockId})
const getPicker = (page, blockId) => page.locator(`#bl-${escapeId(blockId)} .ant-picker`);

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
    await expect(input).toHaveAttribute('placeholder', 'Select date');
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

    // Click a date cell
    await page.locator('.ant-picker-cell-in-view').first().click();

    // In antd v6, showTime pickers require clicking OK to confirm and trigger onChange
    const okButton = page.locator('.ant-picker-ok button:visible');
    if (await okButton.isVisible()) {
      await okButton.click();
    }

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

test.describe('DateTimeSelector Block presets', () => {
  // Pinned to a negative offset, where a preset resolves to a different instant per selectUTC.
  test.use({ timezoneId: 'America/New_York' });

  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'datetimeselector');
  });

  test('lists presets next to the calendar', async ({ page }) => {
    await dateTimeSelector.do.open(page, 'dts_presets');

    await dateTimeSelector.expect.presetLabels(page, 'dts_presets', ['Noon UTC', 'Local morning']);
  });

  test('selects a preset as an instant when selectUTC is not set', async ({ page }) => {
    await dateTimeSelector.do.selectPreset(page, 'dts_presets', 'Noon UTC');

    await dateTimeSelector.expect.closed(page, 'dts_presets');
    // New York is UTC-4 in June, so noon UTC reads as 08:00 on the local clock the block shows.
    await dateTimeSelector.expect.value(page, 'dts_presets', '2024-06-15 08:00');
  });

  test('selects the datetime of a preset given as a date string', async ({ page }) => {
    await dateTimeSelector.do.selectPreset(page, 'dts_presets', 'Local morning');

    await dateTimeSelector.expect.closed(page, 'dts_presets');
    await dateTimeSelector.expect.value(page, 'dts_presets', '2024-06-15 09:30');
    // 09:30 in New York in June is 13:30 UTC.
  });

  test('selects a preset as a UTC wall clock when selectUTC is set', async ({ page }) => {
    await dateTimeSelector.do.selectPreset(page, 'dts_presets_utc', 'Noon UTC');

    await dateTimeSelector.expect.closed(page, 'dts_presets_utc');
    await dateTimeSelector.expect.value(page, 'dts_presets_utc', '2024-06-15 12:00');
  });
});

test.describe('DateTimeSelector antd 6 features', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'datetimeselector');
  });

  const dropdown = (page, blockId) => page.locator(`#bl-${escapeId(blockId)} .ant-picker-dropdown`);

  test('renders the underlined variant', async ({ page }) => {
    await expect(getPicker(page, 'dts_underlined')).toHaveClass(/ant-picker-underlined/);
  });

  test('renders prefix text', async ({ page }) => {
    await expect(getPicker(page, 'dts_prefix_text').locator('.ant-picker-prefix')).toHaveText(
      'From'
    );
  });

  test('renders a prefix icon', async ({ page }) => {
    await expect(
      getPicker(page, 'dts_prefix_icon').locator('.ant-picker-prefix svg')
    ).toBeAttached();
  });

  test('inputReadOnly makes the text input read-only', async ({ page }) => {
    await expect(getInput(page, 'dts_readonly')).toHaveAttribute('readonly', '');
  });

  test('placement and the popup cssKey apply to the calendar popup', async ({ page }) => {
    await getPicker(page, 'dts_placement').click();
    const popup = dropdown(page, 'dts_placement');
    await expect(popup).toBeVisible();
    // The popup flips to the top when there is no room below, but keeps the right alignment.
    await expect(popup).toHaveClass(/ant-picker-dropdown-placement-(bottom|top)Right/);
    await expect(popup).toHaveClass(/dts-custom-popup/);
  });

  test('fires onFocus, onOpenChange and onBlur', async ({ page }) => {
    await getInput(page, 'dts_events').click();
    await expect(getBlock(page, 'dts_focus_display')).toHaveText('Focus: true');
    await expect(getBlock(page, 'dts_open_display')).toHaveText('Open: true');

    await page.keyboard.press('Escape');
    await expect(getBlock(page, 'dts_open_display')).toHaveText('Open: false');

    await getBlock(page, 'dts_underlined').click();
    await expect(getBlock(page, 'dts_blur_display')).toHaveText('Blur: true');
  });

  test('fires onClear when the clear button is clicked', async ({ page }) => {
    const picker = getPicker(page, 'dts_onclear');
    await expect(getInput(page, 'dts_onclear')).not.toHaveValue('');
    await picker.hover();
    await picker.locator('.ant-picker-clear').click();
    await expect(getInput(page, 'dts_onclear')).toHaveValue('');
    await expect(getBlock(page, 'dts_onclear_display')).toHaveText('Clear fired');
  });

  test('showWeek adds week numbers to the calendar', async ({ page }) => {
    await getPicker(page, 'dts_show_week').click();
    const popup = dropdown(page, 'dts_show_week');
    await expect(popup.locator('.ant-picker-date-panel-show-week').first()).toBeVisible();
    await expect(popup.locator('.ant-picker-cell-week').first()).toBeVisible();
  });
});

test.describe('DateTimeSelector confirm and time options', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'datetimeselector');
  });

  test('needConfirm false saves the value without the OK button when the picker closes', async ({
    page,
  }) => {
    await getInput(page, 'dts_no_confirm').click();
    const dropdown = page.locator('#bl-dts_no_confirm .ant-picker-dropdown');
    await expect(dropdown).toBeVisible();
    await expect(dropdown.locator('.ant-picker-ok')).toHaveCount(0);

    await dropdown.locator('.ant-picker-cell-in-view').first().click();
    await expect(getInput(page, 'dts_no_confirm')).not.toHaveValue('');
    // Without the OK button, the selection is saved when the picker closes.
    await getBlock(page, 'dts_basic').click();
    await expect(dropdown).toBeHidden();
    await expect(getBlock(page, 'dts_no_confirm_display')).toHaveText('Value set');
  });

  test('showToday false hides the now button when showNow is not set', async ({ page }) => {
    await getInput(page, 'dts_show_today_false').click();
    await expect(page.locator('#bl-dts_show_today_false .ant-picker-dropdown')).toBeVisible();
    await expect(page.locator('#bl-dts_show_today_false .ant-picker-now')).toHaveCount(0);
  });

  test('a 12 hour timeFormat adds an AM/PM column', async ({ page }) => {
    await getInput(page, 'dts_twelve_hour').click();
    const columns = page.locator('#bl-dts_twelve_hour .ant-picker-time-panel-column');
    await expect(columns).toHaveCount(3);
  });
});
