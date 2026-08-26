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

test.describe('Selector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'selector');
  });

  test('renders trigger with placeholder', async ({ page }) => {
    await expect(page.locator('#selector_basic_input')).toHaveText('Pick a fruit');
  });

  test('opens picker and confirms a value into state', async ({ page }) => {
    await page.locator('#selector_basic_input').click();
    await expect(page.locator('.adm-picker')).toBeVisible();
    // The first column option is selected by default; confirm it.
    await page.locator('.adm-picker-header-button').last().click();
    await expect(getBlock(page, 'selector_value_display')).toHaveText('apple');
    await expect(page.locator('#selector_basic_input')).toHaveText('Apple');
  });
});
