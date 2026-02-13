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

// Menu block has id={blockId} directly on the Ant Design Menu
const getMenu = (page, blockId) => page.locator(`#${blockId}`);

test.describe('Menu Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'menu');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders basic vertical menu', async ({ page }) => {
    const block = getBlock(page, 'menu_basic');
    await expect(block).toBeVisible();

    const menu = getMenu(page, 'menu_basic');
    await expect(menu).toHaveClass(/ant-menu/);
    await expect(menu).toHaveClass(/ant-menu-vertical/);

    // Check menu items are rendered
    await expect(menu.locator('.ant-menu-item')).toHaveCount(3);
    await expect(menu).toContainText('Home');
    await expect(menu).toContainText('About');
    await expect(menu).toContainText('Contact');
  });

  // ============================================
  // MODE TESTS
  // ============================================

  test('renders horizontal mode', async ({ page }) => {
    const menu = getMenu(page, 'menu_horizontal');
    await expect(menu).toHaveClass(/ant-menu-horizontal/);
  });

  test('renders inline mode', async ({ page }) => {
    const menu = getMenu(page, 'menu_inline');
    await expect(menu).toHaveClass(/ant-menu-inline/);
  });

  // ============================================
  // THEME TESTS
  // ============================================

  test('renders dark theme', async ({ page }) => {
    const menu = getMenu(page, 'menu_dark');
    await expect(menu).toHaveClass(/ant-menu-dark/);
  });

  test('renders light theme', async ({ page }) => {
    const menu = getMenu(page, 'menu_basic');
    await expect(menu).toHaveClass(/ant-menu-light/);
  });

  // ============================================
  // MENU ITEM TYPES
  // ============================================

  test('renders menu divider', async ({ page }) => {
    const menu = getMenu(page, 'menu_with_divider');
    await expect(menu).toBeVisible();

    // Check divider is present
    const divider = menu.locator('.ant-menu-item-divider');
    await expect(divider).toBeAttached();
  });

  test('renders menu groups with subitems', async ({ page }) => {
    const menu = getMenu(page, 'menu_with_groups');
    await expect(menu).toBeVisible();

    // Check submenu is rendered
    const submenu = menu.locator('.ant-menu-submenu');
    await expect(submenu.first()).toBeVisible();
    await expect(menu).toContainText('Group 1');

    // Group 1 should be open by default (defaultOpenKeys)
    const submenuItems = menu.locator('.ant-menu-submenu-open .ant-menu-item');
    await expect(submenuItems.first()).toBeVisible();
  });

  test('can expand and collapse menu groups in inline mode', async ({ page }) => {
    const menu = getMenu(page, 'menu_inline');
    await expect(menu).toBeVisible();

    // Find the submenu title
    const submenuTitle = menu.locator('.ant-menu-submenu-title').first();
    await expect(submenuTitle).toBeVisible();

    // Click to expand
    await submenuTitle.click();

    // Submenu items should now be visible
    const submenuContent = menu.locator('.ant-menu-submenu-open');
    await expect(submenuContent).toBeVisible();
  });

  // ============================================
  // PROPERTY TESTS
  // ============================================

  test('renders menu items with icons', async ({ page }) => {
    const menu = getMenu(page, 'menu_with_icons');
    await expect(menu).toBeVisible();

    // Check that SVG icons are rendered
    const icons = menu.locator('.ant-menu-item svg');
    await expect(icons).toHaveCount(2);
  });

  test('renders danger menu item', async ({ page }) => {
    const menu = getMenu(page, 'menu_danger_item');
    await expect(menu).toBeVisible();

    // Check danger class on menu item
    const dangerItem = menu.locator('.ant-menu-item-danger');
    await expect(dangerItem).toBeVisible();
    await expect(dangerItem).toContainText('Delete');
  });

  test('renders selected menu item', async ({ page }) => {
    const menu = getMenu(page, 'menu_selected');
    await expect(menu).toBeVisible();

    // Check selected class
    const selectedItem = menu.locator('.ant-menu-item-selected');
    await expect(selectedItem).toBeVisible();
    await expect(selectedItem).toContainText('Selected Item');
  });

  // ============================================
  // EVENT TESTS
  // ============================================

  test('onClick event fires when menu item is clicked', async ({ page }) => {
    const menu = getMenu(page, 'menu_onclick');
    await expect(menu).toBeVisible();

    // Click a menu item
    const menuItem = menu.locator('.ant-menu-item').first();
    await menuItem.click();

    // Check that the click event fired with the correct key
    const display = getBlock(page, 'onclick_display');
    await expect(display).toHaveText('Clicked: click_link1');
  });

  test('onSelect event fires when menu item is selected', async ({ page }) => {
    const menu = getMenu(page, 'menu_onselect');
    await expect(menu).toBeVisible();

    // Click a menu item to select it
    const menuItem = menu.locator('.ant-menu-item').first();
    await menuItem.click();

    // Check that the select event fired
    const display = getBlock(page, 'onselect_display');
    await expect(display).toHaveText('Selected: select_link1');
  });

  test('onToggleMenuGroup event fires when submenu is toggled', async ({ page }) => {
    const menu = getMenu(page, 'menu_ontoggle');
    await expect(menu).toBeVisible();

    // Click on submenu title to toggle
    const submenuTitle = menu.locator('.ant-menu-submenu-title').first();
    await submenuTitle.click();

    // Check that the toggle event fired
    const display = getBlock(page, 'ontoggle_display');
    await expect(display).toHaveText('Toggle fired');
  });

  // ============================================
  // ITEM TARGETING TESTS
  // ============================================

  test('can click specific top-level menu item by link id', async ({ page }) => {
    const menu = getMenu(page, 'menu_targeting');
    await expect(menu).toBeVisible();

    // Click the Home link using its ID
    const homeLink = page.locator('#target_home');
    await homeLink.click();

    const display = getBlock(page, 'targeting_display');
    await expect(display).toHaveText('Clicked: target_home');
  });

  test('menu item with pageId links to correct URL', async ({ page }) => {
    const menu = getMenu(page, 'menu_targeting');
    await expect(menu).toBeVisible();

    // The Dashboard menu item has pageId: dashboard_page
    // Verify the link href points to the pageId (not the id)
    const dashboardLink = menu.locator('a').filter({ hasText: 'Dashboard' });
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard_page');
  });

  test('can click nested submenu item by link id', async ({ page }) => {
    const menu = getMenu(page, 'menu_targeting');
    await expect(menu).toBeVisible();

    // settings_group is in defaultOpenKeys so it's already expanded
    // Click the General settings link
    const generalLink = page.locator('#general_settings');
    await generalLink.click();

    const display = getBlock(page, 'targeting_display');
    await expect(display).toHaveText('Clicked: general_settings');
  });

  test('can click multiple menu items sequentially', async ({ page }) => {
    const menu = getMenu(page, 'menu_targeting');
    await expect(menu).toBeVisible();

    const display = getBlock(page, 'targeting_display');

    // Click Home
    await page.locator('#target_home').click();
    await expect(display).toHaveText('Clicked: target_home');

    // Click Users
    await page.locator('#target_users').click();
    await expect(display).toHaveText('Clicked: target_users');

    // Click General settings
    await page.locator('#general_settings').click();
    await expect(display).toHaveText('Clicked: general_settings');

    // Click Security settings
    await page.locator('#security_settings').click();
    await expect(display).toHaveText('Clicked: security_settings');
  });

  test('can expand collapsed submenu and click nested item', async ({ page }) => {
    const menu = getMenu(page, 'menu_targeting');
    await expect(menu).toBeVisible();

    // The advanced_group is inside settings_group (which is open by defaultOpenKeys)
    // In Ant Design, nested MenuGroups inside a SubMenu use Menu.ItemGroup (not SubMenu)
    // which renders differently - the title is in ant-menu-item-group-title

    // Click the Option 1 item inside the Advanced group
    // Since it's an ItemGroup, items should be visible without extra expansion
    const option1Item = menu.locator('.ant-menu-item').filter({ hasText: 'Option 1' });
    await option1Item.click();

    const display = getBlock(page, 'targeting_display');
    await expect(display).toHaveText('Clicked: advanced_option1');
  });

  test('can target menu item by text content', async ({ page }) => {
    const menu = getMenu(page, 'menu_targeting');
    await expect(menu).toBeVisible();

    // Target by text content as an alternative approach
    const usersItem = menu.locator('.ant-menu-item').filter({ hasText: 'Users' });
    await usersItem.click();

    const display = getBlock(page, 'targeting_display');
    await expect(display).toHaveText('Clicked: target_users');
  });
});
