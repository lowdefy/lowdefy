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

// Tabs renders with .ant-tabs class
const getTabs = (page, blockId) => getBlock(page, blockId).locator('.ant-tabs');
const getTabItems = (tabs) => tabs.locator('.ant-tabs-tab');

test.describe('Tabs Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tabs');
  });

  test('renders tabs with multiple tab items', async ({ page }) => {
    const block = getBlock(page, 'tabs_basic');
    await expect(block).toBeVisible();
    const tabs = getTabs(page, 'tabs_basic');
    await expect(tabs).toBeVisible();

    const tabItems = getTabItems(tabs);
    await expect(tabItems).toHaveCount(3);
    await expect(tabItems.nth(0)).toContainText('Tab 1');
    await expect(tabItems.nth(1)).toContainText('Tab 2');
    await expect(tabItems.nth(2)).toContainText('Tab 3');
  });

  test('can switch between tabs', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_basic');
    const tabItems = getTabItems(tabs);

    // First tab should be active by default
    await expect(tabItems.nth(0)).toHaveClass(/ant-tabs-tab-active/);

    // Click second tab
    await tabItems.nth(1).click();
    await expect(tabItems.nth(1)).toHaveClass(/ant-tabs-tab-active/);
    await expect(tabItems.nth(0)).not.toHaveClass(/ant-tabs-tab-active/);
  });

  test('renders small size tabs', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_small');
    await expect(tabs).toBeVisible();
    await expect(tabs).toHaveClass(/ant-tabs-small/);
  });

  test('renders large size tabs', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_large');
    await expect(tabs).toBeVisible();
    await expect(tabs).toHaveClass(/ant-tabs-large/);
  });

  test('renders card type tabs', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_card');
    await expect(tabs).toBeVisible();
    await expect(tabs).toHaveClass(/ant-tabs-card/);
  });

  test('renders tabs with position left', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_position_left');
    await expect(tabs).toBeVisible();
    await expect(tabs).toHaveClass(/ant-tabs-left/);
  });

  test('renders tabs with position right', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_position_right');
    await expect(tabs).toBeVisible();
    await expect(tabs).toHaveClass(/ant-tabs-right/);
  });

  test('disabled tab cannot be selected', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_disabled');
    const tabItems = getTabItems(tabs);

    // Second tab should be disabled
    await expect(tabItems.nth(1)).toHaveClass(/ant-tabs-tab-disabled/);
  });

  test('opens tab specified by defaultActiveKey', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_default_active');
    const tabItems = getTabItems(tabs);

    // Second tab should be active by default
    await expect(tabItems.nth(1)).toHaveClass(/ant-tabs-tab-active/);
    await expect(tabItems.nth(0)).not.toHaveClass(/ant-tabs-tab-active/);
  });

  test('renders tabs with icons', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_with_icon');
    const tabItems = getTabItems(tabs);

    // Tabs should have icons (svg elements)
    await expect(tabItems.nth(0).locator('svg')).toBeVisible();
    await expect(tabItems.nth(1).locator('svg')).toBeVisible();
  });

  test('onChange event fires when tab is changed', async ({ page }) => {
    const tabs = getTabs(page, 'tabs_onchange');
    const tabItems = getTabItems(tabs);

    // Click second tab
    await tabItems.nth(1).click();

    const display = getBlock(page, 'onchange_display');
    await expect(display).toHaveText('Active: change2');
  });
});
