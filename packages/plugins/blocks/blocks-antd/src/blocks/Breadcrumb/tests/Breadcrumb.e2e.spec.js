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

// Breadcrumb: use framework wrapper
const getBreadcrumb = (page, blockId) => getBlock(page, blockId);

test.describe('Breadcrumb Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'breadcrumb');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders basic breadcrumb', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_basic');
    await expect(block).toBeVisible();
    const breadcrumb = block.locator('.ant-breadcrumb');
    await expect(breadcrumb).toHaveClass(/ant-breadcrumb/);
  });

  test('renders with string items', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_basic');
    const items = block.locator('.ant-breadcrumb-link');
    await expect(items).toHaveCount(4);
    await expect(items.first()).toContainText('Home');
    await expect(items.last()).toContainText('Item');
  });

  test('renders with label objects', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_with_labels');
    const items = block.locator('.ant-breadcrumb-link');
    await expect(items).toHaveCount(3);
    await expect(items.nth(1)).toContainText('Products');
  });

  // ============================================
  // SEPARATOR TESTS
  // ============================================

  test('renders with custom separator', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_custom_separator');
    const separator = block.locator('.ant-breadcrumb-separator').first();
    await expect(separator).toHaveText('>');
  });

  test('renders with arrow separator', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_arrow_separator');
    const separator = block.locator('.ant-breadcrumb-separator').first();
    await expect(separator).toHaveText('→');
  });

  // ============================================
  // ICON TESTS
  // ============================================

  test('renders with icons', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_with_icons');
    const icons = block.locator('.anticon');
    await expect(icons).toHaveCount(3);
  });

  test('renders icon before label', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_with_icons');
    const firstItem = block.locator('.ant-breadcrumb-link').first();
    const icon = firstItem.locator('.anticon');
    await expect(icon).toBeVisible();
    await expect(firstItem).toContainText('Home');
  });

  // ============================================
  // LINK TESTS
  // ============================================

  test('renders items with links', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_with_links');
    // Items with pageId or url should have anchor tags
    const links = block.locator('a');
    await expect(links.first()).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClick event fires with link and index', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_onclick');
    const secondItem = block.locator('.ant-breadcrumb-link').nth(1);
    await secondItem.click();

    const linkDisplay = getBlock(page, 'onclick_link_display');
    await expect(linkDisplay).toContainText('Link: Products');

    const indexDisplay = getBlock(page, 'onclick_index_display');
    await expect(indexDisplay).toHaveText('Index: 1');
  });

  test('onClick event fires for first item', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_onclick');
    const firstItem = block.locator('.ant-breadcrumb-link').first();
    await firstItem.click();

    const indexDisplay = getBlock(page, 'onclick_index_display');
    await expect(indexDisplay).toHaveText('Index: 0');
  });

  // ============================================
  // STYLE TESTS
  // ============================================

  test('renders with custom style', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_with_style');
    await expect(block).toBeVisible();
    // Style is applied via className
  });

  test('renders items with individual styles', async ({ page }) => {
    const block = getBreadcrumb(page, 'breadcrumb_item_style');
    const items = block.locator('.ant-breadcrumb-link');
    await expect(items).toHaveCount(2);
    // Individual item styles are applied via className
  });
});
