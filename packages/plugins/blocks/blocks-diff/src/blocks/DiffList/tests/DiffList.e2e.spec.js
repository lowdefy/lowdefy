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

test.describe('DiffList Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'diff-list');
  });

  test('renders empty state when before and after are identical', async ({ page }) => {
    const block = getBlock(page, 'diff_list_empty');
    await expect(block).toBeVisible();
    await expect(block.locator('.ant-empty')).toBeVisible();
    await expect(block).toContainText('Nothing to show here.');
  });

  test('renders a basic Changed row with old and new values', async ({ page }) => {
    const block = getBlock(page, 'diff_list_basic');
    await expect(block).toBeVisible();
    await expect(block.locator('.ant-descriptions')).toBeVisible();
    await expect(block).toContainText('member');
    await expect(block).toContainText('admin');
    await expect(block).toContainText('Changed');
  });

  test('applies labels map to remap field names', async ({ page }) => {
    const block = getBlock(page, 'diff_list_labels');
    await expect(block).toContainText('Email address');
    await expect(block).not.toContainText('email:');
  });

  test('hides paths matching a prefix.* pattern', async ({ page }) => {
    const block = getBlock(page, 'diff_list_hide');
    await expect(block).toContainText('a@example.com');
    await expect(block).toContainText('b@example.com');
    await expect(block).not.toContainText('traceId');
  });

  test('renders boolean formatter with custom yes/no labels', async ({ page }) => {
    const block = getBlock(page, 'diff_list_boolean');
    await expect(block).toContainText('Enabled');
    await expect(block).toContainText('Disabled');
  });

  test('renders enum formatter with colored tags', async ({ page }) => {
    const block = getBlock(page, 'diff_list_enum');
    await expect(block).toContainText('Pending');
    await expect(block).toContainText('Paid');
  });

  test('renders Added and Removed change types', async ({ page }) => {
    const block = getBlock(page, 'diff_list_add_remove');
    await expect(block).toContainText('Added');
    await expect(block).toContainText('Removed');
  });

  test('groups changes under multiple root keys in a collapse', async ({ page }) => {
    const block = getBlock(page, 'diff_list_grouped');
    const collapses = block.locator('.ant-collapse > .ant-collapse-item');
    await expect(collapses).toHaveCount(2);
    await expect(block).toContainText('Profile');
    await expect(block).toContainText('Address');
  });

  test('shows unchanged rows when showUnchanged is true', async ({ page }) => {
    const block = getBlock(page, 'diff_list_unchanged');
    await expect(block).toContainText('Unchanged');
    await expect(block).toContainText('Changed');
  });

  test('array-of-objects sub-groups render per-item subheaders', async ({ page }) => {
    const block = getBlock(page, 'diff_list_orders_array');
    await expect(block).toContainText('Order 1');
    await expect(block).toContainText('Order 3');
    await expect(block).toContainText('~1');
    await expect(block).toContainText('+1');
  });

  test('deep path row uses breadcrumb label', async ({ page }) => {
    const block = getBlock(page, 'diff_list_deep_path');
    await expect(block).toContainText('Settings');
    await expect(block).toContainText('Display');
    await expect(block).toContainText('Theme');
    await expect(block).toContainText('Mode');
  });

  test('maxDepth collapses deep changes', async ({ page }) => {
    const block = getBlock(page, 'diff_list_max_depth');
    await expect(block.locator('pre').first()).toBeVisible();
    await expect(block).toContainText('Settings');
    await expect(block).toContainText('Display');
    await expect(block).toContainText('Theme');
    await expect(block).toContainText('"mode": "light"');
    await expect(block).toContainText('"mode": "dark"');
  });
});
