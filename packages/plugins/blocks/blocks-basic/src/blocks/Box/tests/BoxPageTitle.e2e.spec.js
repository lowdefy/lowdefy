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
import { escapeId } from '@lowdefy/e2e-utils';

const getAnchor = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

test.describe('Page title bound to state', () => {
  test('shows the title set by onMount without a navigation', async ({ page }) => {
    await page.goto('/box-page-title/a');
    await expect(page).toHaveTitle('Record a');
  });

  test('follows a state change after the page has loaded', async ({ page }) => {
    await page.goto('/box-page-title/a');
    await expect(page).toHaveTitle('Record a');
    await getAnchor(page, 'rename_record').click();
    await expect(page).toHaveTitle('Renamed a');
  });

  test('follows the page instance on screen', async ({ page }) => {
    await page.goto('/box-page-title/a');
    await expect(page).toHaveTitle('Record a');
    await Promise.all([
      page.waitForURL(/\/box-page-title\/b$/),
      getAnchor(page, 'open_record_b').click(),
    ]);
    await expect(page).toHaveTitle('Record b');
    await page.goBack();
    await expect(page).toHaveURL(/\/box-page-title\/a$/);
    await expect(page).toHaveTitle('Record a');
  });
});
