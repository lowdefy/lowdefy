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
import { navigateToTestPage } from '@lowdefy/block-dev-e2e';

test.describe('TabBar Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tabbar');
  });

  test('renders a tab per menu link with the current page active', async ({ page }) => {
    const tabBar = page.locator('#tab_bar .adm-tab-bar');
    await expect(tabBar).toBeVisible();
    await expect(tabBar.locator('.adm-tab-bar-item')).toHaveCount(2);
    await expect(
      tabBar.locator('.adm-tab-bar-item-active .adm-tab-bar-item-title')
    ).toHaveText('Tabs');
  });

  test('clicking a tab navigates to the linked page', async ({ page }) => {
    await page.locator('#tab_bar .adm-tab-bar-item').nth(1).click();
    await expect(page).toHaveURL(/\/button$/);
  });
});
