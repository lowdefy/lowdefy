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

// Helper to get the tree container using framework wrapper ID (bl-{blockId})
const getTree = (page, blockId) => page.locator(`#bl-${blockId} .ant-tree`);

// Helper to get a tree node by its title text
const getTreeNodeByText = (page, blockId, label) =>
  page.locator(`#bl-${blockId} .ant-tree-treenode`).filter({ hasText: label });

// Helper to get a clickable tree node title by text
const getTreeNodeTitle = (page, blockId, label) =>
  page.locator(`#bl-${blockId} .ant-tree-node-content-wrapper`).filter({ hasText: label });

// Helper to get the expand/collapse switcher for a node
const getTreeNodeSwitcher = (page, blockId, label) =>
  getTreeNodeByText(page, blockId, label).locator('.ant-tree-switcher');

test.describe('TreeSelector Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'treeselector');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders tree with nodes', async ({ page }) => {
    const tree = getTree(page, 'ts_basic');
    await expect(tree).toBeVisible();
    await expect(tree).toHaveClass(/ant-tree/);
  });

  test('renders root nodes visible', async ({ page }) => {
    // Root nodes should be visible
    await expect(getTreeNodeTitle(page, 'ts_basic', 'Parent 1')).toBeVisible();
    await expect(getTreeNodeTitle(page, 'ts_basic', 'Parent 2')).toBeVisible();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders disabled state', async ({ page }) => {
    const tree = getTree(page, 'ts_disabled');
    await expect(tree).toHaveClass(/ant-tree/);
  });

  test('renders with connecting lines when showLine is true', async ({ page }) => {
    const tree = getTree(page, 'ts_show_line');
    await expect(tree).toHaveClass(/ant-tree-show-line/);
  });

  test('renders checkable tree', async ({ page }) => {
    const tree = getTree(page, 'ts_checkable');
    await expect(tree).toBeVisible();
    // Checkboxes should be visible when checkable is true
    const checkbox = tree.locator('.ant-tree-checkbox').first();
    await expect(checkbox).toBeVisible();
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('can expand node by clicking switcher', async ({ page }) => {
    const tree = getTree(page, 'ts_interaction');
    await expect(tree).toBeVisible();

    // Find the switcher for Fruits
    const switcher = getTreeNodeSwitcher(page, 'ts_interaction', 'Fruits');
    await switcher.click();

    // Children should now be visible
    await expect(getTreeNodeTitle(page, 'ts_interaction', 'Apple')).toBeVisible();
    await expect(getTreeNodeTitle(page, 'ts_interaction', 'Banana')).toBeVisible();
  });

  test('can select node by clicking title', async ({ page }) => {
    const nodeTitle = getTreeNodeTitle(page, 'ts_interaction', 'Fruits');
    await nodeTitle.click();

    // The node should be selected
    const node = getTreeNodeByText(page, 'ts_interaction', 'Fruits');
    await expect(node).toHaveClass(/ant-tree-treenode-selected/);
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onChange event fires when node selected', async ({ page }) => {
    // Expand parent first
    const switcher = getTreeNodeSwitcher(page, 'ts_onchange', 'Parent');
    await switcher.click();

    // Select a child node
    await getTreeNodeTitle(page, 'ts_onchange', 'Apple').click();

    const display = getBlock(page, 'ts_onchange_display');
    await expect(display).toContainText('Selected:');
    await expect(display).toContainText('"apple"');
  });
});
