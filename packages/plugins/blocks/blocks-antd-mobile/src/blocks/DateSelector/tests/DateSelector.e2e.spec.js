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

test.describe('DateSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'date-selector');
  });

  test('renders trigger with placeholder', async ({ page }) => {
    await expect(page.locator('#date_basic_input')).toHaveText('Pick a date');
    await expect(getBlock(page, 'date_value_display')).toHaveText('no date');
  });

  test('opens picker and confirms a date into state', async ({ page }) => {
    await page.locator('#date_basic_input').click();
    await expect(page.locator('.adm-picker-view')).toBeVisible();
    await page.locator('.adm-picker-header-button').last().click();
    await expect(getBlock(page, 'date_value_display')).toHaveText('date set');
  });
});
