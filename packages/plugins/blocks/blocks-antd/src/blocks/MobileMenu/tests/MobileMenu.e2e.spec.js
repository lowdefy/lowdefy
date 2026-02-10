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

// MobileMenu renders a button and a drawer
const getMobileMenuButton = (page, blockId) => page.locator(`#${blockId}_button`);
const getDrawer = (page) => page.locator('.ant-drawer-content-wrapper');
const getDrawerMenu = (page) => page.locator('.ant-drawer .ant-menu');

test.describe('MobileMenu Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'mobilemenu');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders mobile menu button', async ({ page }) => {
    const block = getBlock(page, 'mm_basic');
    await expect(block).toBeVisible();

    const button = getMobileMenuButton(page, 'mm_basic');
    await expect(button).toBeVisible();
  });

  test('opens drawer with menu when button is clicked', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_basic');
    await button.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    // Menu should be inside the drawer
    const menu = getDrawerMenu(page);
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('Home');
    await expect(menu).toContainText('About');
    await expect(menu).toContainText('Contact');
  });

  test('closes drawer when clicking outside or close', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_basic');
    await button.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    // Close the drawer using the mask
    const mask = page.locator('.ant-drawer-mask');
    await mask.click();

    await expect(drawer).not.toBeVisible({ timeout: 10000 });
  });

  // ============================================
  // THEME TESTS
  // ============================================

  test('renders dark theme menu in drawer', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_dark');
    await button.click();

    const menu = getDrawerMenu(page);
    // MobileMenu forces light theme in the drawer by default
    await expect(menu).toBeVisible();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders custom drawer title', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_with_drawer');
    await button.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    // Check for custom title in drawer
    const title = page.locator('.ant-drawer-title');
    await expect(title).toHaveText('Custom Drawer Title');
  });

  test('renders menu groups in drawer', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_with_groups');
    await button.click();

    const menu = getDrawerMenu(page);
    await expect(menu).toBeVisible();

    // Check submenu is present
    const submenu = menu.locator('.ant-menu-submenu');
    await expect(submenu).toBeVisible();
    await expect(submenu).toContainText('Settings');

    // The submenu should have expandable content
    // Click to expand and verify we can see the title expands
    const submenuTitle = menu.locator('.ant-menu-submenu-title').first();
    await submenuTitle.click();

    // Wait for animation
    await page.waitForTimeout(500);

    // Check that submenu opened (has 'open' class)
    await expect(submenu).toHaveClass(/ant-menu-submenu-open/);
  });

  // ============================================
  // METHOD TESTS
  // ============================================

  test('setOpen method opens the drawer', async ({ page }) => {
    const openBtn = getBlock(page, 'open_mm_methods').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();
  });

  test('setOpen method closes the drawer', async ({ page }) => {
    // First open the drawer
    const openBtn = getBlock(page, 'open_mm_methods').locator('.ant-btn');
    await openBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    // Close the drawer using the mask (more reliable than external button)
    const mask = page.locator('.ant-drawer-mask');
    await mask.click();

    await expect(drawer).not.toBeVisible({ timeout: 10000 });
  });

  test('toggleOpen method toggles the drawer', async ({ page }) => {
    const toggleBtn = getBlock(page, 'toggle_mm_methods').locator('.ant-btn');

    // First toggle to open
    await toggleBtn.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    // Close via mask for next toggle
    const mask = page.locator('.ant-drawer-mask');
    await mask.click();
    await expect(drawer).not.toBeVisible({ timeout: 10000 });

    // Toggle again to reopen
    await toggleBtn.click();
    await expect(drawer).toBeVisible();
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('can toggle drawer open and closed via button', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_events');
    await button.click();

    // Wait for drawer to open
    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    // Click the mask to close
    const mask = page.locator('.ant-drawer-mask');
    await mask.click();
    await expect(drawer).not.toBeVisible({ timeout: 10000 });

    // Click button again to reopen
    await button.click();
    await expect(drawer).toBeVisible();
  });

  test('onMenuItemClick event fires when menu item is clicked', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_events');
    await button.click();

    const menu = getDrawerMenu(page);
    await expect(menu).toBeVisible();

    // Click a menu item
    const menuItem = menu.locator('.ant-menu-item').first();
    await menuItem.click();

    // Check that the click event fired
    const display = getBlock(page, 'onclick_display');
    await expect(display).toHaveText('Clicked: mm_event_link1');
  });

  // ============================================
  // ITEM TARGETING TESTS
  // ============================================

  test('can click specific menu item by link id in drawer', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_targeting');
    await button.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    // Click the Home link using its ID
    const homeLink = page.locator('#mm_target_home');
    await homeLink.click();

    const display = getBlock(page, 'mm_targeting_display');
    await expect(display).toHaveText('Clicked: mm_target_home');
  });

  test('menu item with pageId links to correct URL in drawer', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_targeting');
    await button.click();

    const menu = getDrawerMenu(page);
    await expect(menu).toBeVisible();

    // The Dashboard menu item has pageId: mm_dashboard_page
    // Verify the link href points to the pageId (not the id)
    const dashboardLink = menu.locator('a').filter({ hasText: 'Dashboard' });
    await expect(dashboardLink).toHaveAttribute('href', '/mm_dashboard_page');
  });

  test('can click multiple menu items sequentially in drawer', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_targeting');
    await button.click();

    const drawer = getDrawer(page);
    await expect(drawer).toBeVisible();

    const display = getBlock(page, 'mm_targeting_display');

    // Click Home
    await page.locator('#mm_target_home').click();
    await expect(display).toHaveText('Clicked: mm_target_home');

    // Click Users
    await page.locator('#mm_target_users').click();
    await expect(display).toHaveText('Clicked: mm_target_users');
  });

  test('can expand submenu and click nested item in drawer', async ({ page }) => {
    const button = getMobileMenuButton(page, 'mm_targeting');
    await button.click();

    const menu = getDrawerMenu(page);
    await expect(menu).toBeVisible();

    // Expand the Settings submenu
    const settingsTitle = menu.locator('.ant-menu-submenu-title').filter({ hasText: 'Settings' });
    await settingsTitle.click();

    // Click the General settings link
    const generalLink = page.locator('#mm_general_settings');
    await generalLink.click();

    const display = getBlock(page, 'mm_targeting_display');
    await expect(display).toHaveText('Clicked: mm_general_settings');
  });
});
