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
import { getBlock } from '@lowdefy/block-dev-e2e';

import openTablePage from '../../../../e2e/openTablePage.js';

const header = (page, blockId, key) =>
  getBlock(page, blockId).locator(`[data-lf-header][data-col-key="${key}"]`);
const trigger = (page, blockId, key) => header(page, blockId, key).locator('[data-lf-header-menu]');
const menuPopup = (page, key) => page.locator(`[data-lf-header-menu-popup][data-col-key="${key}"]`);
const manager = (page) => page.locator('[data-lf-column-manager]');
const managerItem = (page, key) =>
  manager(page).locator(`[data-lf-manager-item][data-col-key="${key}"]`);

function headerKeys(page, blockId) {
  return getBlock(page, blockId)
    .locator('[data-lf-header]')
    .evaluateAll((cells) => cells.map((element) => element.dataset.colKey));
}

function pinnedKeys(page, blockId) {
  return getBlock(page, blockId)
    .locator('[data-lf-header][data-pinned="start"]')
    .evaluateAll((cells) => cells.map((element) => element.dataset.colKey));
}

// Waits for the column manager popover's opening animation, so drag targets hold still.
async function openManager(page) {
  await page.locator('#open_manager').click();
  await expect(manager(page)).toBeVisible();
  await expect(page.locator('.ant-popover:has([data-lf-column-manager])')).not.toHaveClass(
    /-(appear|enter)/
  );
}

async function openMenu(page, blockId, key) {
  await header(page, blockId, key).hover();
  await trigger(page, blockId, key).click();
  await expect(menuPopup(page, key)).toBeVisible();
  return menuPopup(page, key);
}

async function menuItem(page, blockId, key, name) {
  const menu = await openMenu(page, blockId, key);
  await menu.getByRole('menuitem', { name, exact: true }).click();
  await expect(menu).toBeHidden();
}

test.describe('Table header menu', () => {
  test.beforeEach(async ({ page }) => {
    await openTablePage(page, 'table-header-menu');
    await expect(getBlock(page, 'menu_table').locator('.lf-table-body [role="row"]')).toHaveCount(
      5
    );
  });

  // ============================================
  // MENU
  // ============================================

  test('the menu button shows on header hover and opens the menu without sorting', async ({
    page,
  }) => {
    await expect(trigger(page, 'menu_table', 'name')).toHaveCSS('opacity', '0');
    await header(page, 'menu_table', 'name').hover();
    await expect(trigger(page, 'menu_table', 'name')).toHaveCSS('opacity', '1');
    await trigger(page, 'menu_table', 'name').click();
    const menu = menuPopup(page, 'name');
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Sort ascending',
      'Sort descending',
      'Filter…',
      'Pin to start',
      'Pin to end',
      'Freeze up to here',
      'Autosize',
      'Hide column',
      'Columns…',
    ]);
    await expect(trigger(page, 'menu_table', 'name')).toHaveAttribute('aria-expanded', 'true');
    await expect(header(page, 'menu_table', 'name')).toHaveAttribute('aria-sort', 'none');
    // The button toggles the menu.
    await trigger(page, 'menu_table', 'name').click();
    await expect(menu).toBeHidden();
    await expect(header(page, 'menu_table', 'name')).toHaveAttribute('aria-sort', 'none');
  });

  test('a column with filterable false has no Filter item', async ({ page }) => {
    const menu = await openMenu(page, 'menu_table', 'team');
    await expect(menu.getByRole('menuitem', { name: 'Sort ascending' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Filter…' })).toHaveCount(0);
  });

  test('headerMenu false renders no menu button', async ({ page }) => {
    await expect(getBlock(page, 'menu_off_table').locator('[data-lf-header-menu]')).toHaveCount(0);
  });

  test('sort items sort descending, ascending and clear', async ({ page }) => {
    await menuItem(page, 'menu_table', 'name', 'Sort descending');
    await expect(header(page, 'menu_table', 'name')).toHaveAttribute('aria-sort', 'descending');
    await expect(getBlock(page, 'menu_value')).toContainText(
      'sort=[{"key":"name","desc":true}] columns=null cause=sort'
    );
    await menuItem(page, 'menu_table', 'age', 'Sort ascending');
    // A menu sort replaces the sort rather than adding to it.
    await expect(header(page, 'menu_table', 'name')).toHaveAttribute('aria-sort', 'none');
    await expect(header(page, 'menu_table', 'age')).toHaveAttribute('aria-sort', 'ascending');
    const menu = await openMenu(page, 'menu_table', 'age');
    await expect(menu.getByRole('menuitem', { name: 'Sort ascending' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    await menu.getByRole('menuitem', { name: 'Clear sort' }).click();
    await expect(header(page, 'menu_table', 'age')).toHaveAttribute('aria-sort', 'none');
    await expect(getBlock(page, 'menu_value')).toContainText('sort=[] ');
  });

  test('pin to start, pin to end and unpin move the column', async ({ page }) => {
    await menuItem(page, 'menu_table', 'age', 'Pin to start');
    await expect(header(page, 'menu_table', 'age')).toHaveAttribute('data-pinned', 'start');
    expect(await headerKeys(page, 'menu_table')).toEqual(['age', 'name', 'team', 'city']);
    await expect(getBlock(page, 'menu_value')).toContainText('{"key":"age","pinned":"start"}');
    await expect(getBlock(page, 'menu_value')).toContainText('cause=columns');
    const menu = await openMenu(page, 'menu_table', 'age');
    await expect(menu.getByRole('menuitem', { name: 'Pin to start' })).toHaveCount(0);
    await menu.getByRole('menuitem', { name: 'Pin to end' }).click();
    await expect(header(page, 'menu_table', 'age')).toHaveAttribute('data-pinned', 'end');
    expect(await headerKeys(page, 'menu_table')).toEqual(['name', 'team', 'city', 'age']);
    await menuItem(page, 'menu_table', 'age', 'Unpin');
    await expect(header(page, 'menu_table', 'age')).not.toHaveAttribute('data-pinned', /.*/);
    expect(await headerKeys(page, 'menu_table')).toEqual(['name', 'team', 'age', 'city']);
  });

  test('freeze up to here pins the column and every column before it', async ({ page }) => {
    await menuItem(page, 'menu_table', 'team', 'Freeze up to here');
    await expect.poll(() => pinnedKeys(page, 'menu_table')).toEqual(['name', 'team']);
    await menuItem(page, 'menu_table', 'name', 'Freeze up to here');
    await expect.poll(() => pinnedKeys(page, 'menu_table')).toEqual(['name']);
  });

  test('hide column removes it from the table and the view', async ({ page }) => {
    await menuItem(page, 'menu_table', 'city', 'Hide column');
    await expect(header(page, 'menu_table', 'city')).toHaveCount(0);
    await expect(getBlock(page, 'menu_value')).toContainText('{"key":"city","hidden":true}');
  });

  test('autosize fits the column to its content', async ({ page }) => {
    const before = await header(page, 'menu_table', 'city').boundingBox();
    expect(Math.round(before.width)).toBe(70);
    await menuItem(page, 'menu_table', 'city', 'Autosize');
    await expect
      .poll(async () => (await header(page, 'menu_table', 'city').boundingBox()).width)
      .toBeGreaterThan(80);
    const cell = getBlock(page, 'menu_table').locator(
      '.lf-table-body [data-row-key="1"] [data-col-key="city"] .lf-table-cell'
    );
    // "Cape Town" is no longer truncated.
    expect(await cell.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(getBlock(page, 'menu_value')).toContainText('"key":"city","width":');
  });

  test('the menu is keyboard accessible from the header', async ({ page }) => {
    await getBlock(page, 'menu_table')
      .locator('.lf-table-body [data-row-key="1"] [data-col-key="name"]')
      .click();
    await page.keyboard.press('ArrowUp');
    await expect(header(page, 'menu_table', 'name')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(trigger(page, 'menu_table', 'name')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menuPopup(page, 'name')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menuPopup(page, 'name')).toBeHidden();
    await expect(trigger(page, 'menu_table', 'name')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(header(page, 'menu_table', 'name')).toBeFocused();
    await page.keyboard.press('Alt+ArrowDown');
    const items = menuPopup(page, 'name').getByRole('menuitem');
    await expect(items.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(header(page, 'menu_table', 'name')).toHaveAttribute('aria-sort', 'descending');
    await expect(trigger(page, 'menu_table', 'name')).toBeFocused();
  });

  // ============================================
  // COLUMN MANAGER
  // ============================================

  test('Columns… opens the manager listing visible columns first, then hidden', async ({
    page,
  }) => {
    await menuItem(page, 'manager_table', 'team', 'Columns…');
    await expect(manager(page)).toBeVisible();
    const keys = await manager(page)
      .locator('[data-lf-manager-item], [data-lf-manager-boundary]')
      .evaluateAll((elements) =>
        elements.map((element) => element.dataset.colKey ?? `|${element.dataset.boundary}`)
      );
    expect(keys).toEqual(['name', '|start', 'team', 'age', '|end', 'city']);
    await expect(managerItem(page, 'city').locator('input')).not.toBeChecked();
    await expect(managerItem(page, 'team').locator('input')).toBeChecked();
    await manager(page).getByLabel('Search columns').fill('ag');
    await expect(manager(page).locator('[data-lf-manager-item]')).toHaveCount(1);
    await expect(manager(page).locator('[data-lf-manager-boundary]')).toHaveCount(0);
  });

  test('manager checkboxes hide and show columns, one change each', async ({ page }) => {
    await page.locator('#open_manager').click();
    await managerItem(page, 'team').locator('input').click();
    await expect(header(page, 'manager_table', 'team')).toHaveCount(0);
    await expect(getBlock(page, 'manager_value')).toContainText('cause=columns changes=1');
    await managerItem(page, 'city').locator('input').click();
    await expect(header(page, 'manager_table', 'city')).toBeVisible();
    await expect(getBlock(page, 'manager_value')).toContainText('changes=2');
    expect(await headerKeys(page, 'manager_table')).toEqual(['name', 'age', 'city']);
  });

  test('dragging in the manager reorders and pins columns, one change per drop', async ({
    page,
  }) => {
    await openManager(page);
    const handle = (key) => managerItem(page, key).locator('.lf-table-manager-handle');
    await handle('age').dragTo(managerItem(page, 'team'), { targetPosition: { x: 40, y: 2 } });
    await expect.poll(() => headerKeys(page, 'manager_table')).toEqual(['name', 'age', 'team']);
    await expect(getBlock(page, 'manager_value')).toContainText('changes=1');
    // Above the start boundary pins the column.
    await handle('team').dragTo(managerItem(page, 'name'), { targetPosition: { x: 40, y: 2 } });
    await expect.poll(() => pinnedKeys(page, 'manager_table')).toEqual(['team', 'name']);
    await expect(getBlock(page, 'manager_value')).toContainText('changes=2');
    // Alt+ArrowDown on a handle moves it one place (here past the boundary: unpinned).
    await handle('name').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => pinnedKeys(page, 'manager_table')).toEqual(['team']);
    await expect(handle('name')).toBeFocused();
  });

  test('reset to default restores the default view columns', async ({ page }) => {
    await page.locator('#open_manager').click();
    await managerItem(page, 'city').locator('input').click();
    await managerItem(page, 'name').locator('.lf-table-manager-handle').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => pinnedKeys(page, 'manager_table')).toEqual([]);
    await expect(getBlock(page, 'manager_value')).toContainText('changes=2');
    await manager(page).getByRole('button', { name: 'Reset to default' }).click();
    await expect.poll(() => pinnedKeys(page, 'manager_table')).toEqual(['name']);
    await expect(header(page, 'manager_table', 'city')).toHaveCount(0);
    expect(await headerKeys(page, 'manager_table')).toEqual(['name', 'team', 'age']);
    await expect(getBlock(page, 'manager_value')).toContainText('changes=3');
  });

  test('Escape closes the column manager', async ({ page }) => {
    await page.locator('#open_manager').click();
    await expect(manager(page).getByLabel('Search columns')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(manager(page)).toBeHidden();
  });
});
