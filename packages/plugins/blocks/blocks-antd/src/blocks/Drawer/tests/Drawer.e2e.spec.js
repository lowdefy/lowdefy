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

// Drawer renders as .ant-drawer, get the visible one
const getDrawer = (page) => page.locator('.ant-drawer').first();
const getDrawerContent = (page) => page.locator('.ant-drawer-content-wrapper').first();

test.describe('Drawer Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'drawer');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic drawer when opened', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('.ant-drawer-title')).toHaveText('Basic Drawer');
    await expect(drawer.locator('.ant-drawer-body')).toContainText('This is the drawer content.');
  });

  // ============================================
  // PLACEMENT TESTS
  // ============================================

  test('renders drawer from right (default)', async ({ page }) => {
    const openBtn = getBlock(page, 'open_right').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveClass(/ant-drawer-right/);
  });

  test('renders drawer from left', async ({ page }) => {
    const openBtn = getBlock(page, 'open_left').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveClass(/ant-drawer-left/);
  });

  test('renders drawer from top', async ({ page }) => {
    const openBtn = getBlock(page, 'open_top').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveClass(/ant-drawer-top/);
  });

  test('renders drawer from bottom', async ({ page }) => {
    const openBtn = getBlock(page, 'open_bottom').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveClass(/ant-drawer-bottom/);
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders drawer with custom width', async ({ page }) => {
    const openBtn = getBlock(page, 'open_custom_width').locator('.ant-btn');
    await openBtn.click();

    const drawerContent = getDrawerContent(page);
    await expect(drawerContent).toBeVisible();
    await expect(drawerContent).toHaveCSS('width', '500px');
  });

  test('renders drawer without close button when closable is false', async ({ page }) => {
    const openBtn = getBlock(page, 'open_no_close').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
    const closeBtn = drawer.locator('.ant-drawer-close');
    await expect(closeBtn).toHaveCount(0);
  });

  test('renders drawer without mask when mask is false', async ({ page }) => {
    const openBtn = getBlock(page, 'open_no_mask').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
    const mask = drawer.locator('.ant-drawer-mask');
    await expect(mask).toHaveCount(0);
  });

  test('renders drawer with extra area', async ({ page }) => {
    const openBtn = getBlock(page, 'open_with_extra').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
    const extra = drawer.locator('.ant-drawer-extra');
    await expect(extra).toBeVisible();
    await expect(extra.locator('.ant-btn')).toHaveText('Extra Button');
  });

  // ============================================
  // INTERACTION TESTS
  // ============================================

  test('closes drawer when close button is clicked', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const drawerContent = getDrawerContent(page);
    await expect(drawerContent).toBeVisible();

    const closeBtn = page.locator('.ant-drawer-close');
    await closeBtn.click();

    // Wait for drawer to close (animation may take time)
    await expect(drawerContent).not.toBeVisible({ timeout: 10000 });
  });

  test('closes drawer when mask is clicked (maskClosable true)', async ({ page }) => {
    const openBtn = getBlock(page, 'open_basic').locator('.ant-btn');
    await openBtn.click();

    const drawerContent = getDrawerContent(page);
    await expect(drawerContent).toBeVisible();

    const mask = page.locator('.ant-drawer-mask');
    await mask.click();

    // Wait for drawer to close (animation may take time)
    await expect(drawerContent).not.toBeVisible({ timeout: 10000 });
  });

  test('does not close drawer when mask is clicked (maskClosable false)', async ({ page }) => {
    const openBtn = getBlock(page, 'open_mask_not_closable').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    const mask = drawer.locator('.ant-drawer-mask');
    await mask.click({ force: true });

    // Drawer should still be visible
    await expect(drawer).toBeVisible();

    // Close it properly
    const closeBtn = drawer.locator('.ant-drawer-close');
    await closeBtn.click();
  });

  test('toggleOpen method toggles drawer visibility', async ({ page }) => {
    const toggleBtn = getBlock(page, 'toggle_drawer').locator('.ant-btn');

    // Drawer should be closed initially
    const drawerContent = getDrawerContent(page);
    await expect(drawerContent).not.toBeVisible();

    // Toggle open
    await toggleBtn.click();
    await expect(drawerContent).toBeVisible();

    // Close drawer using close button (since mask intercepts pointer events)
    const closeBtn = page.locator('.ant-drawer-close');
    await closeBtn.click();
    await expect(drawerContent).not.toBeVisible({ timeout: 10000 });

    // Toggle open again to verify method still works
    await toggleBtn.click();
    await expect(drawerContent).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onOpen event fires when drawer is opened', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onopen').locator('.ant-btn');
    await openBtn.click();

    const display = getBlock(page, 'onopen_display');
    await expect(display).toHaveText('Open fired');
  });

  test('onClose event fires when drawer is closed', async ({ page }) => {
    const openBtn = getBlock(page, 'open_onclose').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    // Close the drawer
    const closeBtn = drawer.locator('.ant-drawer-close');
    await closeBtn.click();

    const display = getBlock(page, 'onclose_display');
    await expect(display).toHaveText('Close fired');
  });

  test('onToggle event fires when drawer is toggled', async ({ page }) => {
    const openBtn = getBlock(page, 'open_ontoggle').locator('.ant-btn');
    await openBtn.click();

    const display = getBlock(page, 'ontoggle_display');
    await expect(display).toHaveText('Toggle fired');
  });

  test('afterClose event fires after drawer close animation', async ({ page }) => {
    const openBtn = getBlock(page, 'open_afterclose').locator('.ant-btn');
    await openBtn.click();

    const drawerContent = getDrawerContent(page);
    await expect(drawerContent).toBeVisible();

    // Close the drawer
    const closeBtn = page.locator('.ant-drawer-close');
    await closeBtn.click();

    // Wait for drawer to fully close (animation completes)
    await expect(drawerContent).not.toBeVisible({ timeout: 10000 });

    // afterClose should fire after the animation
    const display = getBlock(page, 'afterclose_display');
    await expect(display).toHaveText('AfterClose fired');
  });
});
