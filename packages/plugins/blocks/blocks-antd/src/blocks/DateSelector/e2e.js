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

import { createBlockHelper, escapeId, getBlock } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`.ant-picker:has(#${escapeId(blockId)}_input)`);
const input = (page, blockId) => page.locator(`#${escapeId(blockId)}_input`);
// The block renders the picker popup into a container inside itself, so the dropdown is scoped to
// the block rather than to every open picker on the page.
const pickerDropdown = (page, blockId) => getBlock(page, blockId).locator('.ant-picker-dropdown');
const presets = (page, blockId) => pickerDropdown(page, blockId).locator('.ant-picker-presets');
const presetItem = (page, blockId, label) =>
  presets(page, blockId).locator('li', { hasText: label });

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const navigateToMonth = async (dropdown, targetYear, targetMonth) => {
  const headerView = dropdown.locator('.ant-picker-header-view');
  while (true) {
    const headerText = await headerView.textContent();
    const yearMatch = headerText.match(/\d{4}/);
    if (!yearMatch) {
      throw new Error(`Could not parse year from picker header: "${headerText}"`);
    }
    const currentYear = parseInt(yearMatch[0], 10);
    if (currentYear === targetYear) break;
    if (currentYear > targetYear) {
      await dropdown.locator('.ant-picker-header-super-prev-btn').click();
    } else {
      await dropdown.locator('.ant-picker-header-super-next-btn').click();
    }
  }
  while (true) {
    const headerText = await headerView.textContent();
    const currentMonthName = monthNames.find((m) => headerText.includes(m));
    if (!currentMonthName) {
      throw new Error(`Could not parse month from picker header: "${headerText}"`);
    }
    const currentMonth = monthNames.indexOf(currentMonthName) + 1;
    if (currentMonth === targetMonth) break;
    if (currentMonth > targetMonth) {
      await dropdown.locator('.ant-picker-header-prev-btn').click();
    } else {
      await dropdown.locator('.ant-picker-header-next-btn').click();
    }
  }
};

export default createBlockHelper({
  locator,
  do: {
    open: (page, blockId) => locator(page, blockId).click(),
    fill: async (page, blockId, val) => {
      await input(page, blockId).click();
      await page.keyboard.type(val);
      await page.keyboard.press('Enter');
    },
    select: async (page, blockId, dateString) => {
      const [year, month] = dateString.split('-').map(Number);
      await locator(page, blockId).click();
      const dropdown = pickerDropdown(page, blockId);
      await expect(dropdown).toBeVisible();
      await navigateToMonth(dropdown, year, month);
      await dropdown.locator(`.ant-picker-cell-in-view[title="${dateString}"]`).click();
    },
    selectPreset: async (page, blockId, label) => {
      await locator(page, blockId).click();
      await expect(pickerDropdown(page, blockId)).toBeVisible();
      await presets(page, blockId).getByText(label, { exact: true }).click();
    },
    clear: async (page, blockId) => {
      await locator(page, blockId).hover();
      await locator(page, blockId).locator('.ant-picker-clear').click();
    },
  },
  expect: {
    value: (page, blockId, val) => expect(input(page, blockId)).toHaveValue(val),
    placeholder: (page, blockId, text) =>
      expect(input(page, blockId)).toHaveAttribute('placeholder', text),
    presetLabels: (page, blockId, labels) =>
      expect(presets(page, blockId).locator('li')).toHaveText(labels),
    presetLabelHtml: (page, blockId, { selector, text }) =>
      expect(presets(page, blockId).locator(selector)).toHaveText(text),
    noPresets: (page, blockId) => expect(presets(page, blockId)).toHaveCount(0),
    // A preset the calendar cannot select is disabled through the list item's pointer events, so
    // asserting on those checks the shortcut is really unclickable and not only styled as such.
    presetDisabled: (page, blockId, label) =>
      expect(presetItem(page, blockId, label)).toHaveCSS('pointer-events', 'none'),
    presetEnabled: (page, blockId, label) =>
      expect(presetItem(page, blockId, label)).toHaveCSS('pointer-events', 'auto'),
    dateDisabled: (page, blockId, dateString) =>
      expect(
        pickerDropdown(page, blockId).locator(`.ant-picker-cell[title="${dateString}"]`).first()
      ).toHaveClass(/ant-picker-cell-disabled/),
    dateEnabled: (page, blockId, dateString) =>
      expect(
        pickerDropdown(page, blockId).locator(`.ant-picker-cell[title="${dateString}"]`).first()
      ).not.toHaveClass(/ant-picker-cell-disabled/),
    // The picker only closes the popup once it accepts the value, so a closed popup is the
    // signal that a selection was committed rather than just shown in the input.
    closed: (page, blockId) => expect(pickerDropdown(page, blockId)).toBeHidden(),
  },
});
