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

// Header renders with .ant-layout-header class
const getHeader = (page, blockId) => getBlock(page, blockId).locator('.ant-layout-header');

test.describe('Header Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'header');
  });

  test('renders basic header with content', async ({ page }) => {
    const block = getBlock(page, 'header_basic');
    await expect(block).toBeVisible();
    const header = getHeader(page, 'header_basic');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Header content');
  });

  test('renders header with light theme', async ({ page }) => {
    const header = getHeader(page, 'header_theme_light');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Light theme header');
    // Light theme sets white background
    await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });

  test('renders header with dark theme', async ({ page }) => {
    const header = getHeader(page, 'header_theme_dark');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Dark theme header');
  });

  test('renders header with custom style', async ({ page }) => {
    const header = getHeader(page, 'header_with_style');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Styled header');
  });
});
