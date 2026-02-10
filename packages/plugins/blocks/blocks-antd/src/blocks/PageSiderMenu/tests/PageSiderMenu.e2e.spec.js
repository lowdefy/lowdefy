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

test.describe('PageSiderMenu Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'pagesidermenu');
    // Set desktop viewport for most tests
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders page layout with header and sider', async ({ page }) => {
    // Check that the layout is rendered
    const layout = page.locator('.ant-layout');
    await expect(layout.first()).toBeVisible();

    // Check header is present
    const header = page.locator('.ant-layout-header');
    await expect(header).toBeVisible();

    // Check sider is present
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toBeVisible();
  });

  test('renders inline menu in sider', async ({ page }) => {
    // The inline menu should be visible in the sider
    const menu = page.locator('#pagesidermenu_menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveClass(/ant-menu-inline/);

    // Check menu items
    await expect(menu).toContainText('Dashboard');
    await expect(menu).toContainText('Users');
  });

  test('renders content area', async ({ page }) => {
    // Check content is rendered
    const content = page.locator('.ant-layout-content');
    await expect(content).toBeVisible();

    // Check our content block is there
    const title = getBlock(page, 'main_content');
    await expect(title).toContainText('Main Content Area');
  });

  test('renders breadcrumb', async ({ page }) => {
    // Check breadcrumb is rendered
    const breadcrumb = page.locator('.ant-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Dashboard');
  });

  test('renders header content area', async ({ page }) => {
    // Check header content is rendered
    const headerContent = getBlock(page, 'header_content');
    await expect(headerContent).toContainText('Header Content Area');
  });

  test('renders footer content area', async ({ page }) => {
    // Check footer content is rendered
    const footerContent = getBlock(page, 'footer_content');
    await expect(footerContent).toContainText('Footer Content Area');
  });

  test('renders sider content area', async ({ page }) => {
    // Check sider content is rendered
    const siderContent = getBlock(page, 'sider_content');
    await expect(siderContent).toContainText('Sider Content');
  });

  test('renders logo image', async ({ page }) => {
    // Check logo image is rendered with alt text
    const logo = page.locator('img[alt="Test Logo"]');
    await expect(logo).toBeVisible();
  });

  // ============================================
  // THEME TESTS
  // ============================================

  test('renders light theme sider', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toHaveClass(/ant-layout-sider-light/);
  });

  test('renders menu with light theme', async ({ page }) => {
    const menu = page.locator('#pagesidermenu_menu');
    await expect(menu).toHaveClass(/ant-menu-light/);
  });

  // ============================================
  // MENU GROUP TESTS
  // ============================================

  test('can expand menu groups', async ({ page }) => {
    const menu = page.locator('#pagesidermenu_menu');
    await expect(menu).toBeVisible();

    // Find and click on the Settings submenu
    const submenuTitle = menu.locator('.ant-menu-submenu-title').filter({ hasText: 'Settings' });
    await submenuTitle.click();

    // Sub items should be visible
    await expect(menu).toContainText('General');
    await expect(menu).toContainText('Security');
  });

  // ============================================
  // SIDER COLLAPSE TESTS
  // ============================================

  test('sider can be collapsed via built-in controls', async ({ page }) => {
    // The sider should have a way to collapse
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toBeVisible();

    // Initially not collapsed
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);

    // Use the toggle button we created in the test fixture
    const toggleBtn = getBlock(page, 'toggle_sider_btn').locator('.ant-btn');
    await toggleBtn.click();

    // Sider should now be collapsed
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
  });

  // ============================================
  // METHOD TESTS
  // ============================================

  test('toggleSiderOpen method toggles sider', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toBeVisible();

    // Initially not collapsed (initialCollapsed: false)
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);

    // Click the toggle button we created
    const toggleBtn = getBlock(page, 'toggle_sider_btn').locator('.ant-btn');
    await toggleBtn.click();

    // Sider should be collapsed now
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
  });

  test('setSiderOpen method can close sider', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');

    // Initially not collapsed
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);

    // Click close button
    const closeBtn = getBlock(page, 'close_sider_btn').locator('.ant-btn');
    await closeBtn.click();

    // Sider should be collapsed
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
  });

  test('setSiderOpen method can open sider', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');

    // First close the sider
    const closeBtn = getBlock(page, 'close_sider_btn').locator('.ant-btn');
    await closeBtn.click();
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);

    // Now open it
    const openBtn = getBlock(page, 'open_sider_btn').locator('.ant-btn');
    await openBtn.click();

    // Sider should be open
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
  });

  // ============================================
  // MOBILE TESTS
  // ============================================

  test('shows mobile menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('#pagesidermenu_mobile_menu_button');
    await expect(mobileMenuButton).toBeVisible();
  });

  test('opens mobile menu drawer when button clicked', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Click mobile menu button
    const mobileMenuButton = page.locator('#pagesidermenu_mobile_menu_button');
    await mobileMenuButton.click();

    // Drawer should open with menu
    const drawer = page.locator('.ant-drawer-content-wrapper');
    await expect(drawer).toBeVisible();

    const drawerMenu = page.locator('.ant-drawer .ant-menu');
    await expect(drawerMenu).toBeVisible();
    await expect(drawerMenu).toContainText('Dashboard');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onBreadcrumbClick event fires when breadcrumb is clicked', async ({ page }) => {
    const breadcrumb = page.locator('.ant-breadcrumb');
    await expect(breadcrumb).toBeVisible();

    // Click a breadcrumb item - use li element since not all items are links
    const breadcrumbItem = breadcrumb.locator('li').first();
    await breadcrumbItem.click();

    // Check that the event fired
    const display = getBlock(page, 'breadcrumb_display');
    await expect(display).toContainText('Breadcrumb');
  });

  test('onMenuItemClick event fires when menu item is clicked', async ({ page }) => {
    const menu = page.locator('#pagesidermenu_menu');
    await expect(menu).toBeVisible();

    // Click a menu item
    const menuItem = menu.locator('.ant-menu-item').first();
    await menuItem.click();

    // Check that the event fired
    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psm_link1');
  });

  // ============================================
  // MENU ITEM TARGETING TESTS
  // ============================================

  test('can click specific sider menu item by link id', async ({ page }) => {
    const menu = page.locator('#pagesidermenu_menu');
    await expect(menu).toBeVisible();

    // Click the Dashboard link using its ID
    const dashboardLink = page.locator('#psm_link1');
    await dashboardLink.click();

    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psm_link1');
  });

  test('can click multiple sider menu items sequentially', async ({ page }) => {
    const menu = page.locator('#pagesidermenu_menu');
    await expect(menu).toBeVisible();

    const display = getBlock(page, 'menuitem_display');

    // Click Dashboard
    await page.locator('#psm_link1').click();
    await expect(display).toHaveText('Menu clicked: psm_link1');

    // Click Users
    await page.locator('#psm_link2').click();
    await expect(display).toHaveText('Menu clicked: psm_link2');
  });

  test('can expand submenu and click nested item by link id', async ({ page }) => {
    const menu = page.locator('#pagesidermenu_menu');
    await expect(menu).toBeVisible();

    // Expand the Settings submenu
    const submenuTitle = menu.locator('.ant-menu-submenu-title').filter({ hasText: 'Settings' });
    await submenuTitle.click();

    // Click the General settings link by ID
    const generalLink = page.locator('#psm_sub1');
    await generalLink.click();

    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psm_sub1');
  });

  test('can target sider menu item by text content', async ({ page }) => {
    const menu = page.locator('#pagesidermenu_menu');
    await expect(menu).toBeVisible();

    // Target by text content as an alternative approach
    const usersItem = menu.locator('.ant-menu-item').filter({ hasText: 'Users' });
    await usersItem.click();

    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psm_link2');
  });

  test('can click menu item in mobile menu drawer by text', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile menu
    const mobileMenuButton = page.locator('#pagesidermenu_mobile_menu_button');
    await mobileMenuButton.click();

    const drawer = page.locator('.ant-drawer-content-wrapper');
    await expect(drawer).toBeVisible();

    // Click the Dashboard menu item in the drawer
    // Scope to drawer menu to avoid duplicate ID issues with sider menu
    const drawerMenu = page.locator('.ant-drawer .ant-menu');
    const dashboardItem = drawerMenu.locator('.ant-menu-item').filter({ hasText: 'Dashboard' });
    await dashboardItem.click();

    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psm_link1');
  });
});
