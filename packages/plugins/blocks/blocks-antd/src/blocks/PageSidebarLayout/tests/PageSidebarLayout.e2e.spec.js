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

test.describe('PageSidebarLayout Block', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state for each test
    await page.addInitScript(() => {
      localStorage.removeItem('lf-psl_e2e-open');
    });
    await navigateToTestPage(page, 'pagesidebarlayout');
    // Set desktop viewport for most tests
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders page layout with sider', async ({ page }) => {
    const layout = page.locator('.ant-layout');
    await expect(layout.first()).toBeVisible();

    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toBeVisible();
  });

  test('renders inline menu in sider', async ({ page }) => {
    const menu = page.locator('#pagesidebarlayout_menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveClass(/ant-menu-inline/);

    await expect(menu).toContainText('Dashboard');
    await expect(menu).toContainText('Users');
  });

  test('renders content area', async ({ page }) => {
    const content = page.locator('.ant-layout-content');
    await expect(content).toBeVisible();

    const title = getBlock(page, 'main_content');
    await expect(title).toContainText('Main Content Area');
  });

  test('renders breadcrumb', async ({ page }) => {
    const breadcrumb = page.locator('.ant-breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Home');
    await expect(breadcrumb).toContainText('Dashboard');
  });

  test('renders desktop header content area', async ({ page }) => {
    const headerContent = getBlock(page, 'header_content');
    await expect(headerContent).toContainText('Header Content Area');
  });

  test('renders footer content area', async ({ page }) => {
    const footerContent = getBlock(page, 'footer_content');
    await expect(footerContent).toContainText('Footer Content Area');
  });

  test('renders logo image in sider', async ({ page }) => {
    const logo = page.locator('.ant-layout-sider img[alt="Test Logo"]');
    await expect(logo).toBeVisible();
  });

  // ============================================
  // LOGO RESPONSIVE TESTS
  // ============================================

  test('shows full logo when sider is expanded', async ({ page }) => {
    const logo = page.locator('.ant-layout-sider img[alt="Test Logo"]');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', /logo-light-theme\.png/);
  });

  test('shows square logo when sider is collapsed', async ({ page }) => {
    const toggleBtn = getBlock(page, 'toggle_sider_btn').locator('.ant-btn');
    await toggleBtn.click();

    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);

    const logo = page.locator('.ant-layout-sider img[alt="Test Logo"]');
    await expect(logo).toHaveAttribute('src', /logo-square-light-theme\.png/);
  });

  // ============================================
  // SIDER OPEN/CLOSED SLOT TESTS
  // ============================================

  test('renders siderOpen slot when sider is expanded', async ({ page }) => {
    const siderOpenContent = getBlock(page, 'sider_open_content');
    await expect(siderOpenContent).toBeVisible();

    const siderClosedContent = getBlock(page, 'sider_closed_content');
    await expect(siderClosedContent).not.toBeVisible();
  });

  test('renders siderClosed slot when sider is collapsed', async ({ page }) => {
    const toggleBtn = getBlock(page, 'toggle_sider_btn').locator('.ant-btn');
    await toggleBtn.click();

    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);

    const siderClosedContent = getBlock(page, 'sider_closed_content');
    await expect(siderClosedContent).toBeVisible();

    const siderOpenContent = getBlock(page, 'sider_open_content');
    await expect(siderOpenContent).not.toBeVisible();
  });

  // ============================================
  // THEME TESTS
  // ============================================

  test('renders light theme sider', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toHaveClass(/ant-layout-sider-light/);
  });

  test('renders menu with light theme', async ({ page }) => {
    const menu = page.locator('#pagesidebarlayout_menu');
    await expect(menu).toHaveClass(/ant-menu-light/);
  });

  // ============================================
  // MENU GROUP TESTS
  // ============================================

  test('can expand menu groups', async ({ page }) => {
    const menu = page.locator('#pagesidebarlayout_menu');
    await expect(menu).toBeVisible();

    const submenuTitle = menu.locator('.ant-menu-submenu-title').filter({ hasText: 'Settings' });
    await submenuTitle.click();

    await expect(menu).toContainText('General');
    await expect(menu).toContainText('Security');
  });

  // ============================================
  // SIDER COLLAPSE TESTS
  // ============================================

  test('sider can be collapsed via toggle button', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toBeVisible();
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);

    const toggleBtn = getBlock(page, 'toggle_sider_btn').locator('.ant-btn');
    await toggleBtn.click();

    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
  });

  // ============================================
  // LOCALSTORAGE PERSISTENCE TESTS
  // ============================================

  test('persists sider state to localStorage', async ({ page }) => {
    // Collapse the sider
    const toggleBtn = getBlock(page, 'toggle_sider_btn').locator('.ant-btn');
    await toggleBtn.click();

    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);

    // Check localStorage was written
    const storedValue = await page.evaluate(() => localStorage.getItem('lf-psl_e2e-open'));
    expect(storedValue).toBe('false');
  });

  test('restores sider state from localStorage on reload', async ({ page }) => {
    // Collapse the sider
    const toggleBtn = getBlock(page, 'toggle_sider_btn').locator('.ant-btn');
    await toggleBtn.click();

    const sider = page.locator('.ant-layout-sider');
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);

    // Reload the page
    await page.reload();
    await page.setViewportSize({ width: 1200, height: 800 });

    // Sider should still be collapsed
    const siderAfterReload = page.locator('.ant-layout-sider');
    await expect(siderAfterReload).toHaveClass(/ant-layout-sider-collapsed/);
  });

  // ============================================
  // METHOD TESTS
  // ============================================

  test('toggleSiderOpen method toggles sider', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);

    const toggleBtn = getBlock(page, 'toggle_sider_btn').locator('.ant-btn');
    await toggleBtn.click();

    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
  });

  test('setSiderOpen method can close sider', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');
    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);

    const closeBtn = getBlock(page, 'close_sider_btn').locator('.ant-btn');
    await closeBtn.click();

    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);
  });

  test('setSiderOpen method can open sider', async ({ page }) => {
    const sider = page.locator('.ant-layout-sider');

    const closeBtn = getBlock(page, 'close_sider_btn').locator('.ant-btn');
    await closeBtn.click();
    await expect(sider).toHaveClass(/ant-layout-sider-collapsed/);

    const openBtn = getBlock(page, 'open_sider_btn').locator('.ant-btn');
    await openBtn.click();

    await expect(sider).not.toHaveClass(/ant-layout-sider-collapsed/);
  });

  // ============================================
  // MOBILE TESTS
  // ============================================

  test('hides sider on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const sider = page.locator('.ant-layout-sider');
    await expect(sider).not.toBeVisible();
  });

  test('shows mobile menu button on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('#pagesidebarlayout_mobile_menu_button');
    await expect(mobileMenuButton).toBeVisible();
  });

  test('shows mobile extra content on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileExtra = getBlock(page, 'mobile_extra_content');
    await expect(mobileExtra).toBeVisible();
    await expect(mobileExtra).toContainText('Mobile Extra');
  });

  test('opens mobile menu drawer when button clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('#pagesidebarlayout_mobile_menu_button');
    await mobileMenuButton.click();

    const drawer = page.locator('.ant-drawer-content-wrapper');
    await expect(drawer).toBeVisible();

    const drawerMenu = page.locator('.ant-drawer .ant-menu');
    await expect(drawerMenu).toBeVisible();
    await expect(drawerMenu).toContainText('Dashboard');
  });

  test('renders mobileDrawerContent in mobile drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('#pagesidebarlayout_mobile_menu_button');
    await mobileMenuButton.click();

    const drawer = page.locator('.ant-drawer-content-wrapper');
    await expect(drawer).toBeVisible();

    const drawerContent = getBlock(page, 'mobile_drawer_content');
    await expect(drawerContent).toContainText('Mobile Drawer Content');
  });

  test('renders mobileDrawerFooter in mobile drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('#pagesidebarlayout_mobile_menu_button');
    await mobileMenuButton.click();

    const drawer = page.locator('.ant-drawer-content-wrapper');
    await expect(drawer).toBeVisible();

    const footer = page.locator('.ant-drawer-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Mobile Drawer Footer');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onBreadcrumbClick event fires when breadcrumb is clicked', async ({ page }) => {
    const breadcrumb = page.locator('.ant-breadcrumb');
    await expect(breadcrumb).toBeVisible();

    const breadcrumbItem = breadcrumb.locator('li').first();
    await breadcrumbItem.click();

    const display = getBlock(page, 'breadcrumb_display');
    await expect(display).toContainText('Breadcrumb');
  });

  test('onMenuItemClick event fires when menu item is clicked', async ({ page }) => {
    const menu = page.locator('#pagesidebarlayout_menu');
    await expect(menu).toBeVisible();

    const menuItem = menu.locator('.ant-menu-item').first();
    await menuItem.click();

    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psl_link1');
  });

  test('onToggleSider event fires when sider toggle button is clicked', async ({ page }) => {
    // Click the built-in toggle button in the sider
    const siderToggle = page.locator('#pagesidebarlayout_toggle_sider .ant-btn');
    await siderToggle.click();

    const display = getBlock(page, 'toggle_sider_display');
    await expect(display).toHaveText('Toggle sider fired');
  });

  // ============================================
  // MENU ITEM TARGETING TESTS
  // ============================================

  test('can click specific sider menu item by link id', async ({ page }) => {
    const menu = page.locator('#pagesidebarlayout_menu');
    await expect(menu).toBeVisible();

    const dashboardLink = page.locator('#psl_link1');
    await dashboardLink.click();

    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psl_link1');
  });

  test('can click multiple sider menu items sequentially', async ({ page }) => {
    const menu = page.locator('#pagesidebarlayout_menu');
    await expect(menu).toBeVisible();

    const display = getBlock(page, 'menuitem_display');

    await page.locator('#psl_link1').click();
    await expect(display).toHaveText('Menu clicked: psl_link1');

    await page.locator('#psl_link2').click();
    await expect(display).toHaveText('Menu clicked: psl_link2');
  });

  test('can expand submenu and click nested item by link id', async ({ page }) => {
    const menu = page.locator('#pagesidebarlayout_menu');
    await expect(menu).toBeVisible();

    const submenuTitle = menu.locator('.ant-menu-submenu-title').filter({ hasText: 'Settings' });
    await submenuTitle.click();

    const generalLink = page.locator('#psl_sub1');
    await generalLink.click();

    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psl_sub1');
  });

  test('can click menu item in mobile menu drawer by text', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileMenuButton = page.locator('#pagesidebarlayout_mobile_menu_button');
    await mobileMenuButton.click();

    const drawer = page.locator('.ant-drawer-content-wrapper');
    await expect(drawer).toBeVisible();

    const drawerMenu = page.locator('.ant-drawer .ant-menu');
    const dashboardItem = drawerMenu.locator('.ant-menu-item').filter({ hasText: 'Dashboard' });
    await dashboardItem.click();

    const display = getBlock(page, 'menuitem_display');
    await expect(display).toHaveText('Menu clicked: psl_link1');
  });
});
