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

test.describe('Popover Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'popover');
  });

  test('renders popover on hover with title and content', async ({ page }) => {
    const trigger = getBlock(page, 'popover_basic_trigger');
    await trigger.hover();
    const popover = page.locator('.ant-popover').filter({ hasText: 'Popover Title' });
    await expect(popover).toBeVisible();
    await expect(popover.locator('.ant-popover-title')).toHaveText('Popover Title');
    await expect(popover).toContainText('Popover content here');
  });

  test('renders popover with placement top', async ({ page }) => {
    const trigger = getBlock(page, 'popover_placement_top_trigger');
    await trigger.hover();
    const popover = page.locator('.ant-popover').filter({ hasText: 'Top Popover' });
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Top content');
  });

  test('renders popover with placement bottom', async ({ page }) => {
    const trigger = getBlock(page, 'popover_placement_bottom_trigger');
    await trigger.hover();
    const popover = page.locator('.ant-popover').filter({ hasText: 'Bottom Popover' });
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Bottom content');
  });

  test('renders popover with placement left', async ({ page }) => {
    const trigger = getBlock(page, 'popover_placement_left_trigger');
    await trigger.hover();
    const popover = page.locator('.ant-popover').filter({ hasText: 'Left Popover' });
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Left content');
  });

  test('renders popover with placement right', async ({ page }) => {
    const trigger = getBlock(page, 'popover_placement_right_trigger');
    await trigger.hover();
    const popover = page.locator('.ant-popover').filter({ hasText: 'Right Popover' });
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Right content');
  });

  test('renders popover with hover trigger', async ({ page }) => {
    // Close any open popovers first by pressing Escape
    await page.keyboard.press('Escape');
    const trigger = getBlock(page, 'popover_trigger_hover_trigger');
    await trigger.scrollIntoViewIfNeeded();
    const popover = page.locator('.ant-popover').filter({ hasText: 'Hover Popover' });
    // Popover should not be visible initially
    await expect(popover).not.toBeVisible();
    // Hover to show
    await trigger.hover();
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Hover content');
  });

  test('renders popover with click trigger', async ({ page }) => {
    // Close any open popovers first by pressing Escape
    await page.keyboard.press('Escape');
    const trigger = getBlock(page, 'popover_trigger_click_trigger');
    await trigger.scrollIntoViewIfNeeded();
    const popover = page.locator('.ant-popover').filter({ hasText: 'Click Popover' });
    // Popover should not be visible initially
    await expect(popover).not.toBeVisible();
    // Click to show
    await trigger.click();
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Click content');
  });

  test('renders popover with custom color', async ({ page }) => {
    // Close any open popovers first by pressing Escape
    await page.keyboard.press('Escape');
    const trigger = getBlock(page, 'popover_color_trigger');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.hover();
    const popover = page.locator('.ant-popover').filter({ hasText: 'Colored Popover' });
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Blue content');
  });

  test('renders popover open by default when defaultOpen is true', async ({ page }) => {
    // This popover should be visible without any interaction
    const popover = page.locator('.ant-popover').filter({ hasText: 'Default Open' });
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Open by default');
  });

  test('onOpenChange event fires when popover visibility changes', async ({ page }) => {
    const trigger = getBlock(page, 'popover_onopenchange_trigger');
    await trigger.click();
    const display = getBlock(page, 'onopenchange_display');
    await expect(display).toHaveText('Open changed!');
  });
});
