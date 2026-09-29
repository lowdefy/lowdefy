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

const row = (page, label) =>
  getBlock(page, 'conversations').locator('li.ant-conversations-item', { hasText: label });

test.describe('AgentConversations loading', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'agent-conversations');
  });

  test('an item with loading true shows a spinner and is marked busy', async ({ page }) => {
    const loadingRow = row(page, 'Generating a title');
    await expect(loadingRow.locator('.ant-spin')).toBeVisible();
    await expect(loadingRow).toHaveAttribute('aria-busy', 'true');
    await expect(loadingRow).toHaveAttribute('data-loading', 'true');

    await expect(row(page, 'First conversation').locator('.ant-spin')).toHaveCount(0);
    await expect(row(page, 'First conversation')).not.toHaveAttribute('aria-busy', 'true');
  });

  test('the row matching loadingKey shows a spinner until loadingKey clears', async ({ page }) => {
    const second = row(page, 'Second conversation');
    await expect(second.locator('.ant-spin')).toHaveCount(0);

    await second.click();
    await expect(page.locator('#readout_active')).toHaveText('conv-2');
    await expect(second).toHaveClass(/ant-conversations-item-active/);
    await expect(second.locator('.ant-spin')).toBeVisible();
    await expect(second).toHaveAttribute('aria-busy', 'true');
    await expect(row(page, 'First conversation').locator('.ant-spin')).toHaveCount(0);

    await page.locator('#finish_loading').click();
    await expect(second.locator('.ant-spin')).toHaveCount(0);
    await expect(second).not.toHaveAttribute('aria-busy', 'true');
    // Loading only covered the row; the selection stays.
    await expect(second).toHaveClass(/ant-conversations-item-active/);
  });
});
