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

test.describe('NavBar Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'navbar');
  });

  test('renders navbar title', async ({ page }) => {
    const navbar = getBlock(page, 'navbar_basic').locator('.adm-nav-bar');
    await expect(navbar).toBeVisible();
    await expect(navbar.locator('.adm-nav-bar-title')).toHaveText('Page Title');
  });

  test('onBack event fires when back area is clicked', async ({ page }) => {
    await expect(getBlock(page, 'back_display')).toHaveText('not clicked');
    await getBlock(page, 'navbar_basic').locator('.adm-nav-bar-back').click();
    await expect(getBlock(page, 'back_display')).toHaveText('back clicked');
  });

  test('hides back area when back is false', async ({ page }) => {
    await expect(getBlock(page, 'navbar_no_back').locator('.adm-nav-bar-back')).toHaveCount(0);
  });
});
