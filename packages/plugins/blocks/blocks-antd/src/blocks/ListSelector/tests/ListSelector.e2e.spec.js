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

test.describe('ListSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'list_selector');
  });

  test('selects a card and stores its valueKey field', async ({ page }) => {
    await page.locator('#ls_basic_1').click();
    await expect(page.locator('#ls_basic_1')).toHaveAttribute('aria-selected', 'true');
    await expect(getBlock(page, 'ls_basic_display')).toHaveText('Selected: 2');
  });

  test('renders default-size cards without the small class', async ({ page }) => {
    const card = page.locator('#ls_size_default_0');
    await expect(card).toBeVisible();
    await expect(card).not.toHaveClass(/ant-card-small/);
  });

  test('renders small cards with size small', async ({ page }) => {
    await expect(page.locator('#ls_size_small_0')).toHaveClass(/ant-card-small/);
  });
});
