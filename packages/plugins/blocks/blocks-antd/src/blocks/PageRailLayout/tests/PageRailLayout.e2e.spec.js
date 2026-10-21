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

test.describe('PageRailLayout Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await navigateToTestPage(page, 'pagerail');
  });

  test('renders the rail, panel and content', async ({ page }) => {
    await expect(page.locator('#pagerail_rail')).toBeVisible();
    await expect(page.locator('#pagerail_rail')).toContainText('Controls');
    await expect(page.locator('#pagerail_panel')).toContainText('Panel Header');
    await expect(page.locator('#pagerail_panel')).toContainText('Panel Content');
    await expect(getBlock(page, 'rail_main_content')).toContainText('Main Content Area');
    await expect(getBlock(page, 'rail_content_header_text')).toContainText('Content Header');
  });

  test('lights the selected place and shows badges', async ({ page }) => {
    const active = page.locator('#pagerail_rail .lf-rail-item-active');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('Controls');
    await expect(page.locator('#pagerail_rail .lf-rail-badge').first()).toHaveText('12');
    await expect(page.locator('#pagerail_rail .lf-rail-badge[data-tone="error"]')).toHaveText('3');
  });

  test('shows a hover tip with the title and tip', async ({ page }) => {
    await page.locator('#pagerail_rail .lf-rail-item').filter({ hasText: 'Controls' }).hover();
    const tip = page.locator('.ant-tooltip');
    await expect(tip).toContainText('Controls');
    await expect(tip).toContainText('All controls');
  });

  test('fires onFootItemClick for a foot item without a page', async ({ page }) => {
    await page.locator('#pagerail_rail .lf-rail-item').filter({ hasText: 'Search' }).click();
    await expect(getBlock(page, 'rail_foot_display')).toContainText('Foot clicked: search');
  });

  test('opens the profile menu', async ({ page }) => {
    await page.locator('#pagerail_profile').click();
    await expect(page.locator('.ant-dropdown')).toContainText('Sign out');
    await expect(page.locator('.ant-dropdown')).toContainText('System');
  });

  test('resizes the panel with the arrow keys and remembers the width', async ({ page }) => {
    const handle = page.getByRole('separator', { name: 'Resize panel' });
    await expect(handle).toHaveAttribute('aria-valuenow', '300');
    await handle.focus();
    await page.keyboard.press('ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', '316');
    await expect(getBlock(page, 'rail_resize_display')).toContainText('Resized: 316');
    await page.reload();
    await expect(page.getByRole('separator', { name: 'Resize panel' })).toHaveAttribute(
      'aria-valuenow',
      '316'
    );
  });

  test('resizes the panel by dragging and holds it to the range', async ({ page }) => {
    const handle = page.getByRole('separator', { name: 'Resize panel' });
    const box = await handle.boundingBox();
    await page.mouse.move(box.x + 3, box.y + 200);
    await page.mouse.down();
    await page.mouse.move(box.x + 3 + 1000, box.y + 200, { steps: 5 });
    await page.mouse.up();
    await expect(handle).toHaveAttribute('aria-valuenow', '480');
  });

  test('turns the panel into a drawer on a tablet', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(page.locator('#pagerail_panel')).toHaveCount(0);
    await expect(page.locator('#pagerail_rail')).toBeVisible();
    await page.locator('#pagerail_panel_toggle').click();
    await expect(page.locator('#pagerail_drawer')).toContainText('Panel Content');
  });

  test('turns the rail into a tab bar with More on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('#pagerail_rail')).toHaveCount(0);
    const bar = page.locator('#pagerail_tab_bar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('Controls');
    await expect(bar).not.toContainText('Audit');
    await bar.locator('.lf-rail-item').filter({ hasText: 'More' }).click();
    await expect(page.locator('#pagerail_more_sheet')).toContainText('Audit');
    await expect(page.locator('#pagerail_more_sheet')).toContainText('Notifications');
  });
});
