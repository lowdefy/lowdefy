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

// ControlledList renders with .ant-list class
const getList = (page, blockId) => getBlock(page, blockId).locator('.ant-list');
const getListItems = (list) => list.locator('.ant-list-item');
const getAddButton = (page, blockId) => page.locator(`#${blockId}_add_button`);

test.describe('ControlledList Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'controlledlist');
  });

  test('renders basic controlled list with title', async ({ page }) => {
    const block = getBlock(page, 'controlledlist_basic');
    await expect(block).toBeVisible();
    const list = getList(page, 'controlledlist_basic');
    await expect(list).toBeVisible();

    // Check title is rendered
    await expect(list.locator('.ant-list-header')).toContainText('Basic List');
  });

  test('renders list with items', async ({ page }) => {
    const list = getList(page, 'controlledlist_with_items');
    await expect(list).toBeVisible();

    const items = getListItems(list);
    await expect(items).toHaveCount(3);
    await expect(items.nth(0)).toContainText('Item: Item 1');
    await expect(items.nth(1)).toContainText('Item: Item 2');
    await expect(items.nth(2)).toContainText('Item: Item 3');
  });

  test('renders small size list', async ({ page }) => {
    const list = getList(page, 'controlledlist_small');
    await expect(list).toBeVisible();
    await expect(list).toHaveClass(/ant-list-sm/);
  });

  test('renders large size list', async ({ page }) => {
    const list = getList(page, 'controlledlist_large');
    await expect(list).toBeVisible();
    await expect(list).toHaveClass(/ant-list-lg/);
  });

  test('renders add button at front when addToFront is true', async ({ page }) => {
    const list = getList(page, 'controlledlist_add_front');
    await expect(list).toBeVisible();

    // Add button should be in header
    const header = list.locator('.ant-list-header');
    await expect(header.locator('.ant-btn')).toBeVisible();
  });

  test('hides add button when hideAddButton is true', async ({ page }) => {
    const list = getList(page, 'controlledlist_hide_add');
    await expect(list).toBeVisible();

    // Add button should not be visible
    const addButton = getAddButton(page, 'controlledlist_hide_add');
    await expect(addButton).toBeHidden();
  });

  test('renders custom add button', async ({ page }) => {
    const list = getList(page, 'controlledlist_custom_add');
    await expect(list).toBeVisible();

    const addButton = getAddButton(page, 'controlledlist_custom_add');
    await expect(addButton).toContainText('New Entry');
    // The add button element itself is the .ant-btn
    await expect(addButton).toHaveClass(/ant-btn-primary/);
  });

  test('renders custom no data title', async ({ page }) => {
    const list = getList(page, 'controlledlist_nodata');
    await expect(list).toBeVisible();

    // Check empty text in the list's empty state
    await expect(list).toContainText('No items available');
  });

  test('enforces minimum items', async ({ page }) => {
    const list = getList(page, 'controlledlist_minitems');
    await expect(list).toBeVisible();

    // Should have at least 2 items due to minItems: 2
    const items = getListItems(list);
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('can add new item', async ({ page }) => {
    const list = getList(page, 'controlledlist_add');
    const addButton = getAddButton(page, 'controlledlist_add');

    // Initially no items
    let items = getListItems(list);
    const initialCount = await items.count();

    // Click add button
    await addButton.click();

    // Should have one more item
    items = getListItems(list);
    await expect(items).toHaveCount(initialCount + 1);
  });

  test('can remove item', async ({ page }) => {
    const list = getList(page, 'controlledlist_remove');
    await expect(list).toBeVisible();

    let items = getListItems(list);
    await expect(items).toHaveCount(3);

    // Click remove icon on first item
    const removeIcon = items.nth(0).locator('[id$="_remove_icon"]');
    await removeIcon.click();

    // Should have one less item
    items = getListItems(list);
    await expect(items).toHaveCount(2);
  });
});
