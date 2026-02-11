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

// Footer renders with .ant-layout-footer class
const getFooter = (page, blockId) => getBlock(page, blockId).locator('.ant-layout-footer');

test.describe('Footer Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'footer');
  });

  test('renders basic footer with content', async ({ page }) => {
    const block = getBlock(page, 'footer_basic');
    await expect(block).toBeVisible();
    const footer = getFooter(page, 'footer_basic');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Footer content');
  });

  test('renders footer with custom style', async ({ page }) => {
    const footer = getFooter(page, 'footer_with_style');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Styled footer');
  });

  test('renders footer with link content', async ({ page }) => {
    const footer = getFooter(page, 'footer_with_links');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Privacy Policy');
    await expect(footer).toContainText('Terms of Service');
  });
});
