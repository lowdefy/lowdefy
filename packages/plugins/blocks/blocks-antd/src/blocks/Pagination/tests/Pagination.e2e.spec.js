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

// Pagination renders with .ant-pagination class
const getPagination = (page, blockId) => getBlock(page, blockId).locator('.ant-pagination');
const getPageItems = (pagination) => pagination.locator('.ant-pagination-item');

test.describe('Pagination Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'pagination');
  });

  test('renders basic pagination', async ({ page }) => {
    const block = getBlock(page, 'pagination_basic');
    await expect(block).toBeVisible();
    const pagination = getPagination(page, 'pagination_basic');
    await expect(pagination).toBeVisible();

    // Should have page items
    const pageItems = getPageItems(pagination);
    const count = await pageItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('renders with initial value', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_with_value');
    await expect(pagination).toBeVisible();

    // Page 3 should be active
    const activePage = pagination.locator('.ant-pagination-item-active');
    await expect(activePage).toHaveAttribute('title', '3');
  });

  test('renders small size pagination', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_small');
    await expect(pagination).toBeVisible();
    await expect(pagination).toHaveClass(/ant-pagination-mini/);
  });

  test('renders simple pagination', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_simple');
    await expect(pagination).toBeVisible();
    await expect(pagination).toHaveClass(/ant-pagination-simple/);
  });

  test('renders with total shown', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_show_total');
    await expect(pagination).toBeVisible();

    // Total indicator should be visible
    const total = pagination.locator('.ant-pagination-total-text');
    await expect(total).toBeVisible();
    await expect(total).toContainText('85');
  });

  test('renders with size changer', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_size_changer');
    await expect(pagination).toBeVisible();

    // Size changer dropdown should be visible
    const sizeChanger = pagination.locator('.ant-pagination-options-size-changer');
    await expect(sizeChanger).toBeVisible();
  });

  test('renders with quick jumper', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_quick_jumper');
    await expect(pagination).toBeVisible();

    // Quick jumper input should be visible
    const quickJumper = pagination.locator('.ant-pagination-options-quick-jumper');
    await expect(quickJumper).toBeVisible();
  });

  test('renders disabled pagination', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_disabled');
    await expect(pagination).toBeVisible();
    await expect(pagination).toHaveClass(/ant-pagination-disabled/);
  });

  test('can navigate to next page', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_basic');

    // Click page 2
    const page2 = pagination.locator('.ant-pagination-item-2');
    await page2.click();

    // Page 2 should be active
    await expect(page2).toHaveClass(/ant-pagination-item-active/);
  });

  test('onChange event fires when page changes', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_onchange');

    // Click page 3
    const page3 = pagination.locator('.ant-pagination-item-3');
    await page3.click();

    const display = getBlock(page, 'onchange_display');
    await expect(display).toContainText('Page: 3');
  });

  test('onSizeChange event fires when page size changes', async ({ page }) => {
    const pagination = getPagination(page, 'pagination_onsizechange');

    // Click size changer
    const sizeChanger = pagination.locator('.ant-pagination-options-size-changer');
    await sizeChanger.click();

    // Select a different size option
    const option = page.locator('.ant-select-item-option').filter({ hasText: '20' });
    await option.click();

    const display = getBlock(page, 'onsizechange_display');
    await expect(display).toHaveText('New Size: 20');
  });
});
