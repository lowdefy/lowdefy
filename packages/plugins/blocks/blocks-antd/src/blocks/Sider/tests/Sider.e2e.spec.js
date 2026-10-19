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

  test('renders sider with light background', async ({ page }) => {
    const sider = getSider(page, 'sider_theme_light_sider');
    await expect(sider).toBeVisible();
    await expect(sider).toContainText('Light sider');
  });

  test('renders sider with dark background', async ({ page }) => {
    const sider = getSider(page, 'sider_theme_dark_sider');
    await expect(sider).toBeVisible();
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

  test('collapses the sider when the trigger is clicked', async ({ page }) => {
    const sider = getSider(page, 'sider_collapsible_sider');
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
    const trigger = sider.locator('.ant-layout-sider-trigger');
    // The app's icons are Lucide svgs, where antd's own trigger arrows are not.
    await expect(trigger.locator('svg.lucide')).toBeAttached();
    await trigger.click();
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
    await expect(getBlock(page, 'sider_collapsible_display')).toHaveText('sider:closed');
    await trigger.click();
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
  });

  test('collapses to the default 80px when collapsedWidth is null', async ({ page }) => {
    const sider = getSider(page, 'sider_null_widths_sider');
    await expect(sider).toHaveCSS('width', '232px');
    await getBlock(page, 'sider_null_widths_toggle').locator('button').click();
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
    await expect(sider).toHaveCSS('width', '80px');
    await expect(sider).toHaveCSS('flex-basis', '80px');
  });

  test('renders collapsed at 80px when collapsedWidth and width are null', async ({ page }) => {
    const sider = getSider(page, 'sider_null_widths_collapsed_sider');
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
    await expect(sider).toHaveCSS('width', '80px');
    await getBlock(page, 'sider_null_widths_collapsed_toggle').locator('button').click();
    // antd's default expanded width.
    await expect(sider).toHaveCSS('width', '200px');
  });

  test('applies the body class and style', async ({ page }) => {
    const sider = getSider(page, 'sider_body_sider');
    const body = sider.locator('.ant-layout-sider-children.sider-custom-body');
    await expect(body).toContainText('Sider body');
    await expect(body).toHaveCSS('padding-top', '12px');
  });

  test('fires onBreakpoint with broken when the screen is below the breakpoint', async ({
    page,
  }) => {
    await expect(getBlock(page, 'sider_broken_display')).toHaveText('broken:true');
  });
});
