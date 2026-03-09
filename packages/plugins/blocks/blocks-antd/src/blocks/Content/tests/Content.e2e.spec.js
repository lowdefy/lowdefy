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

// Content renders with .ant-layout-content class
const getContent = (page, blockId) => getBlock(page, blockId).locator('.ant-layout-content');

test.describe('Content Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'content');
  });

  test('renders basic content area', async ({ page }) => {
    const block = getBlock(page, 'content_basic');
    await expect(block).toBeVisible();
    const content = getContent(page, 'content_basic');
    await expect(content).toBeVisible();
    await expect(content).toContainText('Main content area');
  });

  test('renders content with custom style', async ({ page }) => {
    const content = getContent(page, 'content_with_style');
    await expect(content).toBeVisible();
    await expect(content).toContainText('Styled content');
  });

  test('renders content with nested blocks', async ({ page }) => {
    const content = getContent(page, 'content_nested');
    await expect(content).toBeVisible();
    // Check nested card
    const card = content.locator('.ant-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Card inside content');
  });
});
