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

test.describe('Tooltip Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tooltip');
  });

  test('renders tooltip on hover', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_basic_trigger');
    await trigger.hover();
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Basic tooltip text' });
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip with placement top', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_placement_top_trigger');
    await trigger.hover();
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Top tooltip' });
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip with placement bottom', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_placement_bottom_trigger');
    await trigger.hover();
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Bottom tooltip' });
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip with placement left', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_placement_left_trigger');
    await trigger.hover();
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Left tooltip' });
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip with placement right', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_placement_right_trigger');
    await trigger.hover();
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Right tooltip' });
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip with hover trigger', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_trigger_hover_trigger');
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Hover tooltip' });
    // Tooltip should not be visible initially
    await expect(tooltip).toBeHidden();
    // Hover to show
    await trigger.hover();
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip with click trigger', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_trigger_click_trigger');
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Click tooltip' });
    // Tooltip should not be visible initially
    await expect(tooltip).toBeHidden();
    // Click to show
    await trigger.click();
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip with focus trigger', async ({ page }) => {
    const input = page.locator('#tooltip_trigger_focus_trigger_input');
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Focus tooltip' });
    // Tooltip should not be visible initially
    await expect(tooltip).toBeHidden();
    // Focus to show
    await input.focus();
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip with custom color', async ({ page }) => {
    // Close any open tooltips first by clicking elsewhere
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    const trigger = getBlock(page, 'tooltip_color_trigger');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.hover();
    // Color tooltips get the color in title
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Colored tooltip' });
    await expect(tooltip).toBeVisible();
  });

  test('renders tooltip visible by default when defaultVisible is true', async ({ page }) => {
    // This tooltip should be visible without any interaction
    const tooltip = page.locator('.ant-tooltip').filter({ hasText: 'Visible by default' });
    await expect(tooltip).toBeVisible();
  });

  test('onVisibleChange event fires when tooltip visibility changes', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_onvisiblechange_trigger');
    await trigger.click();
    const display = getBlock(page, 'onvisiblechange_display');
    await expect(display).toHaveText('Visibility changed!');
  });

  test('renders HTML content in tooltip title', async ({ page }) => {
    const trigger = getBlock(page, 'tooltip_html_title_trigger');
    await trigger.hover();
    const tooltip = page.locator('.ant-tooltip').filter({ has: page.locator('strong') });
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator('strong')).toHaveText('Bold');
    await expect(tooltip.locator('em')).toHaveText('italic');
  });
});
