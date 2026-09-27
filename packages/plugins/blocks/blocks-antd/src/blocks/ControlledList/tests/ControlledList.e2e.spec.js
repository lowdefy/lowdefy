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
import { escapeId } from '@lowdefy/e2e-utils';

// ControlledList renders with .ant-list class
const getList = (page, blockId) => getBlock(page, blockId).locator('.ant-list');
const getListItems = (list) => list.locator('.ant-list-item');
const getAddButton = (page, blockId) => page.locator(`#${escapeId(blockId)}_add_button`);

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

    // One item from state, plus one pushed to reach minItems: 2
    await expect(getListItems(list)).toHaveCount(2);
    await expect(getListItems(list).nth(0)).toContainText('Name: Item 1');
    // At minItems there is nothing to remove
    await expect(list.locator('.lf-controlled-list-remove')).toHaveCount(0);
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

  // ============================================
  // LOOK: antd List styles and theme tokens
  // ============================================

  test('renders the bordered antd List look', async ({ page }) => {
    const list = getList(page, 'controlledlist_with_items');
    await expect(list).toHaveClass(/ant-list-split/);
    await expect(list).toHaveClass(/ant-list-bordered/);
    await expect(list).toHaveClass(/ant-list-something-after-last-item/);
    await expect(list).toHaveCSS('border-top', '1px solid rgb(217, 217, 217)');
    await expect(list).toHaveCSS('border-radius', '8px');
    const header = list.locator('.ant-list-header');
    await expect(header).toHaveCSS('padding', '12px 24px');
    await expect(header).toHaveCSS('border-bottom', '1px solid rgba(5, 5, 5, 0.06)');
    const items = getListItems(list);
    await expect(items.first()).toHaveCSS('display', 'flex');
    await expect(items.first()).toHaveCSS('padding', '12px 24px');
    // The footer follows the items, so the last item keeps its bottom border
    await expect(items.last()).toHaveCSS('border-bottom', '1px solid rgba(5, 5, 5, 0.06)');
    await expect(list.locator('.ant-list-footer')).toHaveCSS('padding', '12px 24px');
  });

  test('drops the last item border when nothing follows the items', async ({ page }) => {
    const list = getList(page, 'controlledlist_front_items');
    await expect(list).not.toHaveClass(/ant-list-something-after-last-item/);
    await expect(getListItems(list).last()).toHaveCSS('border-bottom-style', 'none');
  });

  test('pads items for the small and large sizes', async ({ page }) => {
    const small = getList(page, 'controlledlist_small_items');
    await expect(getListItems(small).first()).toHaveCSS('padding', '8px 16px');
    await expect(small.locator('.ant-list-header')).toHaveCSS('padding', '8px 16px');
    const large = getList(page, 'controlledlist_large_items');
    await expect(getListItems(large).first()).toHaveCSS('padding', '16px 24px');
  });

  test('styles the empty state like antd List', async ({ page }) => {
    const empty = getList(page, 'controlledlist_nodata').locator('.ant-list-empty-text');
    await expect(empty).toHaveText('No items available');
    await expect(empty).toHaveCSS('padding', '16px');
    await expect(empty).toHaveCSS('text-align', 'center');
    await expect(empty).toHaveCSS('color', 'rgba(0, 0, 0, 0.25)');
  });

  test('applies List and global tokens from theme', async ({ page }) => {
    const list = getList(page, 'controlledlist_theme');
    await expect(list).toHaveCSS('border-top-color', 'rgb(114, 46, 209)');
    await expect(list).toHaveCSS('border-radius', '2px');
    await expect(list.locator('.ant-list-header')).toHaveCSS(
      'background-color',
      'rgb(230, 244, 255)'
    );
    await expect(list.locator('.ant-list-footer')).toHaveCSS(
      'background-color',
      'rgb(246, 255, 237)'
    );
    const item = getListItems(list).first();
    await expect(item).toHaveCSS('padding', '20px 24px');
    await expect(item).toHaveCSS('border-bottom-color', 'rgb(255, 77, 79)');
    await expect(getListItems(getList(page, 'controlledlist_theme_small')).first()).toHaveCSS(
      'padding',
      '2px 40px'
    );
    await expect(
      getList(page, 'controlledlist_theme_empty').locator('.ant-list-empty-text')
    ).toHaveCSS('padding', '4px');
  });
});
