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

// Layout renders with .ant-layout class
const getLayout = (page, blockId) => getBlock(page, blockId).locator('.ant-layout');

test.describe('Layout Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'layout');
  });

  test('renders basic layout with content', async ({ page }) => {
    const block = getBlock(page, 'layout_basic');
    await expect(block).toBeVisible();
    const layout = getLayout(page, 'layout_basic');
    await expect(layout).toBeVisible();
    await expect(layout).toContainText('Layout content');
  });

  test('renders layout with custom style', async ({ page }) => {
    const layout = getLayout(page, 'layout_with_style');
    await expect(layout).toBeVisible();
    await expect(layout).toContainText('Styled layout');
  });

  test('renders nested layout with header, content, and footer', async ({ page }) => {
    const layout = getLayout(page, 'layout_nested');
    await expect(layout).toBeVisible();

    // Check header
    const header = layout.locator('.ant-layout-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Header');

    // Check content
    const content = layout.locator('.ant-layout-content');
    await expect(content).toBeVisible();
    await expect(content).toContainText('Main content');

    // Check footer
    const footer = layout.locator('.ant-layout-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Footer');
  });
});
