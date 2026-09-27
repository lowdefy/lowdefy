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

test.describe('Splitter Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'splitter_block');
  });

  // ============================================
  // BASIC RENDERING TESTS
  // ============================================

  test('renders two panels with content', async ({ page }) => {
    const block = getBlock(page, 'sp_basic');
    await expect(block).toBeVisible();

    // Check both panels render their content
    await expect(block).toContainText('Left Panel');
    await expect(block).toContainText('Right Panel');

    // Verify two panels exist
    const panels = block.locator('.ant-splitter-panel');
    await expect(panels).toHaveCount(2);
  });

  test('renders resize bar', async ({ page }) => {
    const block = getBlock(page, 'sp_basic');
    const bar = block.locator('.ant-splitter-bar');
    await expect(bar).toBeAttached();
  });

  // ============================================
  // VERTICAL LAYOUT TEST
  // ============================================

  test('renders vertical layout', async ({ page }) => {
    const block = getBlock(page, 'sp_vertical');
    await expect(block).toBeVisible();

    // Verify vertical layout class
    const splitter = block.locator('.ant-splitter');
    await expect(splitter).toHaveClass(/ant-splitter-vertical/);

    // Verify content renders
    await expect(block).toContainText('Top Panel');
    await expect(block).toContainText('Bottom Panel');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('fires onResizeEnd event when bar is dragged', async ({ page }) => {
    const block = getBlock(page, 'sp_resize');
    await expect(block).toBeVisible();

    const dragger = block.locator('.ant-splitter-bar-dragger');
    await expect(dragger).toBeAttached();

    // Drag the resize dragger handle
    const box = await dragger.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
    await page.mouse.up();

    const display = getBlock(page, 'sp_resize_display');
    await expect(display).toHaveText('Resize fired');
  });

  // ============================================
  // ANTD 6 FEATURES
  // ============================================

  test('orientation vertical renders a vertical splitter', async ({ page }) => {
    const splitter = getBlock(page, 'sp_orientation').locator('.ant-splitter');
    await expect(splitter).toHaveClass(/ant-splitter-vertical/);
  });

  test('panel cssKey styles each panel', async ({ page }) => {
    const panels = getBlock(page, 'sp_features').locator('.ant-splitter-panel');
    await expect(panels.first()).toHaveCSS('background-color', 'rgb(240, 248, 255)');
  });

  test('draggerIcon renders an icon in the drag handle', async ({ page }) => {
    const block = getBlock(page, 'sp_features');
    await expect(block.locator('.ant-splitter-bar-dragger-icon svg')).toBeAttached();
  });

  test('collapsible icon and destroyOnHidden apply when a panel collapses', async ({ page }) => {
    const block = getBlock(page, 'sp_features');
    const collapseStart = block.locator('.ant-splitter-bar-collapse-start');
    await expect(collapseStart.locator('svg.lucide')).toBeAttached();
    await expect(block).toContainText('First panel');
    await collapseStart.click();
    await expect(page.locator('#bl-sp_features_first')).not.toBeAttached();
  });

  test('onDraggerDoubleClick fires with the handle index', async ({ page }) => {
    const dragger = getBlock(page, 'sp_features').locator('.ant-splitter-bar-dragger');
    await dragger.dblclick();
    await expect(getBlock(page, 'sp_double_click_display')).toHaveText('Double click on 0');
  });
});
