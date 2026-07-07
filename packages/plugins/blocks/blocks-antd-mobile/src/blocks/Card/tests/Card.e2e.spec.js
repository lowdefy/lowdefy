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

test.describe('Card Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'card');
  });

  test('renders card with title and content blocks', async ({ page }) => {
    const card = getBlock(page, 'card_basic').locator('.adm-card');
    await expect(card).toBeVisible();
    await expect(card.locator('.adm-card-header-title')).toHaveText('Card Title');
    await expect(getBlock(page, 'card_content')).toHaveText('Card content text');
  });
});
