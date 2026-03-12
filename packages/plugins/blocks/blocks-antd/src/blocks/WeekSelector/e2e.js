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

import { createBlockHelper, escapeId } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`.ant-picker:has(#${escapeId(blockId)}_input)`);
const input = (page, blockId) => page.locator(`#${escapeId(blockId)}_input`);

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
    const currentYear = parseInt(headerText.match(/\d{4}/)[0]);
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
      const dropdown = page.locator('.ant-picker-dropdown:visible');
      await expect(dropdown).toBeVisible();
      await navigateToMonth(dropdown, year, month);
      await dropdown.locator(`.ant-picker-cell-in-view[title="${dateString}"]`).click();
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
  },
});
