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

const getArea = (page, blockId) => getBlock(page, blockId).locator('.adm-text-area-element');

test.describe('TextArea Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'text-area');
  });

  test('renders textarea with placeholder', async ({ page }) => {
    const area = getArea(page, 'area_basic');
    await expect(area).toBeVisible();
    await expect(area).toHaveAttribute('placeholder', 'Enter notes');
  });

  test('typing sets the block value in state', async ({ page }) => {
    await getArea(page, 'area_basic').fill('Some longer notes');
    await expect(getBlock(page, 'area_value_display')).toHaveText('Some longer notes');
  });
});
