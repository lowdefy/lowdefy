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

// Sider renders with .ant-layout-sider class
const getSider = (page, blockId) => getBlock(page, blockId).locator('.ant-layout-sider');

test.describe('Sider Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'sider');
  });

  test('renders basic sider with content', async ({ page }) => {
    const block = getBlock(page, 'sider_basic_sider');
    await expect(block).toBeVisible();
    const sider = getSider(page, 'sider_basic_sider');
    await expect(sider).toBeVisible();
    await expect(sider).toContainText('Sider content');
  });

  test('renders sider with light theme', async ({ page }) => {
    const sider = getSider(page, 'sider_theme_light_sider');
    await expect(sider).toBeVisible();
    await expect(sider).toHaveClass(/ant-layout-sider-light/);
    await expect(sider).toContainText('Light sider');
  });

  test('renders sider with dark theme', async ({ page }) => {
    const sider = getSider(page, 'sider_theme_dark_sider');
    await expect(sider).toBeVisible();
    await expect(sider).toHaveClass(/ant-layout-sider-dark/);
    await expect(sider).toContainText('Dark sider');
  });

  test('renders sider in collapsed state', async ({ page }) => {
    const sider = getSider(page, 'sider_collapsed_sider');
    await expect(sider).toBeVisible();
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
  });

  test('renders sider in expanded state', async ({ page }) => {
    const sider = getSider(page, 'sider_expanded_sider');
    await expect(sider).toBeVisible();
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
    await expect(sider).toContainText('Expanded sider');
  });

  test('renders sider with custom width', async ({ page }) => {
    const sider = getSider(page, 'sider_custom_width_sider');
    await expect(sider).toBeVisible();
    await expect(sider).toContainText('Wide sider');
    // Width should be 300px
    await expect(sider).toHaveCSS('width', '300px');
  });

  test('renders collapsible sider with trigger', async ({ page }) => {
    const sider = getSider(page, 'sider_collapsible_sider');
    await expect(sider).toBeVisible();
    // Collapsible sider should have a trigger
    const trigger = sider.locator('.ant-layout-sider-trigger');
    await expect(trigger).toBeVisible();
  });

  // Note: Toggle via trigger requires onCollapse handler which the Sider component
  // doesn't expose. Sider uses setOpen/toggleOpen methods for programmatic control.
});
