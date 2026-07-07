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

test.describe('List Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'list');
  });

  test('renders a List.Item per state array item', async ({ page }) => {
    const list = getBlock(page, 'task_list').locator('.adm-list');
    await expect(list).toBeVisible();
    await expect(list.locator('.adm-list-header')).toHaveText('Tasks');
    await expect(list.locator('.adm-list-item')).toHaveCount(3);
    await expect(list.locator('.adm-list-item').nth(1)).toContainText('Second task');
  });

  test('onItemClick fires with the item index', async ({ page }) => {
    await expect(getBlock(page, 'clicked_display')).toHaveText('none');
    await getBlock(page, 'task_list').locator('.adm-list-item').nth(2).click();
    await expect(getBlock(page, 'clicked_display')).toHaveText('2');
  });
});
