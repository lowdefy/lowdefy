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

test.describe('PageHeaderMenu Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'pageheadermenu');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders page layout with header', async ({ page }) => {
    // Check that the layout is rendered
    const layout = page.locator('.ant-layout');
    await expect(layout.first()).toBeVisible();

    // Check header is present
    const header = page.locator('.ant-layout-header');
    await expect(header).toBeVisible();
  });

  test('renders horizontal menu in header on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });

    // The horizontal menu should be visible on desktop
    const menu = page.locator('#pageheadermenu_menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveClass(/ant-menu-horizontal/);

    // Check menu items
    await expect(menu).toContainText('Dashboard');
    await expect(menu).toContainText('Settings');
    await expect(menu).toContainText('Help');
  });

  test('renders mobile menu button on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('#pageheadermenu_mobile_menu_button');
    await expect(mobileMenuButton).toBeVisible();
  });

  test('renders content area', async ({ page }) => {
    // Check content is rendered
    const content = page.locator('.ant-layout-content');
    await expect(content).toBeVisible();

    // Check our content block is there
    const title = getBlock(page, 'basic_content');
    await expect(title).toContainText('Page Content');
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
    await expect(headerContent).toContainText('Header Content');
  });

  test('renders logo image', async ({ page }) => {
    // Check logo image is rendered with alt text
    const logo = page.locator('img[alt="Test Logo"]');
    await expect(logo).toBeVisible();
  });

  // ============================================
  // THEME TESTS
  // ============================================

  test('renders dark theme header', async ({ page }) => {
    const header = page.locator('.ant-layout-header');
    await expect(header).toBeVisible();

    // The menu in header should have dark theme
    const menu = page.locator('#pageheadermenu_menu');
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(menu).toHaveClass(/ant-menu-dark/);
  });

  // ============================================
  // MOBILE MENU TESTS
  // ============================================

  test('opens mobile menu drawer when button clicked', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Click mobile menu button
    const mobileMenuButton = page.locator('#pageheadermenu_mobile_menu_button');
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

    // Click a breadcrumb item - use the item that has text "Home"
    // Breadcrumb items might be li or span elements, not always anchor tags
    const breadcrumbItem = breadcrumb.locator('li').first();
    await breadcrumbItem.click();

    // Check that the event fired
    const display = getBlock(page, 'onclick_display');
    await expect(display).toContainText('Breadcrumb clicked');
  });

  // ============================================
  // MENU ITEM TARGETING TESTS
  // ============================================

  test('can click menu items in header menu', async ({ page }) => {
    // Set desktop viewport for horizontal menu
    await page.setViewportSize({ width: 1200, height: 800 });

    const menu = page.locator('#pageheadermenu_menu');
    await expect(menu).toBeVisible();

    // Click the Dashboard menu item - verify it's clickable and becomes active
    const dashboardItem = menu.locator('.ant-menu-item').filter({ hasText: 'Dashboard' });
    await dashboardItem.click();

    // After clicking, the item should be active (selection depends on page navigation)
    await expect(dashboardItem).toHaveClass(/ant-menu-item-active/);
  });

  test('can click menu items in mobile menu drawer', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile menu
    const mobileMenuButton = page.locator('#pageheadermenu_mobile_menu_button');
    await mobileMenuButton.click();

    const drawer = page.locator('.ant-drawer-content-wrapper');
    await expect(drawer).toBeVisible();

    // Click the Dashboard menu item in the drawer
    const drawerMenu = page.locator('.ant-drawer .ant-menu');
    const dashboardItem = drawerMenu.locator('.ant-menu-item').filter({ hasText: 'Dashboard' });
    await dashboardItem.click();

    // After clicking, the item should be active
    await expect(dashboardItem).toHaveClass(/ant-menu-item-active/);
  });
});
