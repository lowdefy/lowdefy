/*
  Copyright 2020-2024 Lowdefy, Inc

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

test.describe('Icon Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'icon');
  });

  test('renders default icon', async ({ page }) => {
    const icon = getBlock(page, 'icon_default');
    await expect(icon).toBeVisible();
  });

  test('renders custom icon by name', async ({ page }) => {
    const icon = getBlock(page, 'icon_custom');
    await expect(icon).toBeVisible();
  });

  test('onClick event fires', async ({ page }) => {
    const icon = getBlock(page, 'icon_clickable');
    await icon.click();
    await expect(icon).toBeVisible();
  });
});
