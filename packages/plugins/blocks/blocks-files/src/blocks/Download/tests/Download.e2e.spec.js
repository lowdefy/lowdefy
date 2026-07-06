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

test.describe('Download Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'download');
  });

  test('renders file list items', async ({ page }) => {
    const block = getBlock(page, 'download_basic');
    await expect(block).toBeVisible();
    const items = block.locator('.ant-upload-list-item');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText('report.pdf');
    await expect(items.nth(1)).toContainText('summary.xlsx');
  });

  test('renders empty list without items', async ({ page }) => {
    const block = getBlock(page, 'download_empty');
    await expect(block.locator('.ant-upload-list-item')).toHaveCount(0);
  });

  test('shows download icon on file items', async ({ page }) => {
    const item = getBlock(page, 'download_basic').locator('.ant-upload-list-item').first();
    await item.hover();
    await expect(item.locator('.anticon-download')).toBeVisible();
  });

  test('onRemove fires with the file and does not remove the item from the list', async ({
    page,
  }) => {
    const block = getBlock(page, 'download_remove');
    const item = block.locator('.ant-upload-list-item');
    await expect(item).toHaveCount(1);
    await item.hover();
    await item.locator('.anticon-delete').click();
    const display = getBlock(page, 'remove_display');
    await expect(display).toHaveText('Removed: removable.pdf');
    // The handler owns fileList updates — the item must remain rendered.
    await expect(item).toHaveCount(1);
  });
});
