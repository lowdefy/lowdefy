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

const handle = (page) => page.getByRole('separator', { name: 'Resize panel' });
const layout = (page) => page.locator('#pagerail');

async function drag(page, from, dx) {
  const box = await from.boundingBox();
  const y = box.y + 200;
  await page.mouse.move(box.x + box.width / 2, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + dx, y, { steps: 8 });
  await page.mouse.up();
}

test.describe('PageRailLayout Block', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 800 });
    await navigateToTestPage(page, 'pagerail');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('renders the rail, bar, panel and content', async ({ page }) => {
    await expect(page.locator('#pagerail_rail')).toContainText('Controls');
    await expect(page.locator('#pagerail_bar')).toContainText('Northwind Holdings');
    await expect(page.locator('#pagerail_bar')).toContainText('Access control');
    await expect(page.locator('#pagerail_panel')).toContainText('Panel Content');
    await expect(getBlock(page, 'rail_main_content')).toContainText('Main Content Area');
    await expect(getBlock(page, 'rail_header_button')).toBeVisible();
  });

  test('lights the selected place and shows badges', async ({ page }) => {
    const active = page.locator('#pagerail_rail .lf-rail-item-active');
    await expect(active).toHaveCount(1);
    await expect(active).toContainText('Controls');
    await expect(page.locator('#pagerail_rail .lf-rail-badge').first()).toHaveText('12');
    await expect(page.locator('#pagerail_rail .lf-rail-badge-error').first()).toHaveText('3');
  });

  test('shows a hover tip with the title and tip', async ({ page }) => {
    await page.locator('#pagerail_rail .lf-rail-item').filter({ hasText: 'Controls' }).hover();
    const tip = page.locator('.ant-tooltip');
    await expect(tip).toContainText('Controls');
    await expect(tip).toContainText('All controls');
  });

  test('fires onFootItemClick for a foot item without a page', async ({ page }) => {
    await page.locator('#pagerail_rail .lf-rail-item').filter({ hasText: 'Search' }).click();
    await expect(getBlock(page, 'rail_foot_display')).toContainText('Foot clicked: search');
  });

  test('opens the profile menu with the name, links and theme', async ({ page }) => {
    await page.locator('#pagerail_profile').click();
    const menu = page.locator('.ant-dropdown');
    await expect(menu).toContainText('Alex Brown');
    await expect(menu).toContainText('alex@example.com');
    await expect(menu).toContainText('Sign out');
    await expect(menu).toContainText('Theme');
  });

  test('switches from a crumb, filtering and picking with the keyboard', async ({ page }) => {
    await page.locator('#pagerail_crumb_org').click();
    const filter = page.getByPlaceholder('Find…');
    await expect(filter).toBeFocused();
    await filter.fill('mer');
    await expect(page.locator('.lf-rail-switcher-item')).toHaveCount(2);
    await page.keyboard.press('Enter');
    await expect(getBlock(page, 'rail_switch_display')).toContainText('Switched: org:ms');
    await expect(page.locator('.lf-rail-switcher')).toHaveCount(0);
  });

  test('runs a switcher action', async ({ page }) => {
    await page.locator('#pagerail_crumb_org').click();
    await page.locator('.lf-rail-switcher-row').filter({ hasText: 'New organisation' }).click();
    await expect(getBlock(page, 'rail_switch_display')).toContainText('Switched: org action new');
  });

  test('resizes the panel with the arrow keys and remembers the width', async ({ page }) => {
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '300');
    await handle(page).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '380');
    await expect(getBlock(page, 'rail_resize_display')).toContainText('Resized: 380');
    await page.keyboard.press('Home');
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '240');
    await page.keyboard.press('End');
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '480');
    await page.reload();
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '480');
  });

  test('resizes the panel by dragging, held to the range', async ({ page }) => {
    await drag(page, handle(page), 80);
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '380');
    await drag(page, handle(page), 1000);
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '480');
    const panel = await page.locator('#pagerail_panel').boundingBox();
    expect(Math.round(panel.width)).toBe(480);
  });

  test('a short drag below the smallest width springs back', async ({ page }) => {
    await drag(page, handle(page), -80);
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '240');
    await expect(layout(page)).toHaveAttribute('data-panel', 'open');
  });

  test('a drag far past the smallest width collapses the panel, and a click opens it', async ({
    page,
  }) => {
    await drag(page, handle(page), -260);
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
    await expect(getBlock(page, 'rail_toggle_display')).toContainText('Panel: closed by drag');
    await expect(handle(page)).toHaveAttribute('aria-valuetext', 'Collapsed');
    await page.reload();
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
    await handle(page).click();
    await expect(layout(page)).toHaveAttribute('data-panel', 'open');
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '300');
    await expect(getBlock(page, 'rail_toggle_display')).toContainText('Panel: open by edge');
  });

  test('Enter on the edge collapses and opens the panel, reported as the keyboard', async ({
    page,
  }) => {
    await handle(page).focus();
    await page.keyboard.press('Enter');
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
    await expect(getBlock(page, 'rail_toggle_display')).toContainText('Panel: closed by keyboard');
    await page.keyboard.press('Enter');
    await expect(layout(page)).toHaveAttribute('data-panel', 'open');
    await expect(getBlock(page, 'rail_toggle_display')).toContainText('Panel: open by keyboard');
  });

  test('a double-click on the edge puts the width back', async ({ page }) => {
    await drag(page, handle(page), 120);
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '420');
    await handle(page).dblclick();
    await expect(handle(page)).toHaveAttribute('aria-valuenow', '300');
  });

  test('the bar button and the shortcut collapse and open the panel', async ({ page }) => {
    await page.locator('#pagerail_panel_toggle').click();
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
    await expect(page.locator('#pagerail_panel_toggle')).toHaveAttribute('aria-expanded', 'false');
    // The block reads mod from the platform the page reports, which the e2e browser may set
    // apart from the machine running the test.
    const isMac = await page.evaluate(() => /Mac|iPhone|iPad/.test(navigator.platform));
    await page.keyboard.press(`${isMac ? 'Meta' : 'Control'}+Backslash`);
    await expect(layout(page)).toHaveAttribute('data-panel', 'open');
    await expect(getBlock(page, 'rail_toggle_display')).toContainText('Panel: open by shortcut');
  });

  test('turns the panel into a drawer on a tablet', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(layout(page)).toHaveAttribute('data-mode', 'tablet');
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
    await expect(page.locator('#pagerail_rail')).toBeVisible();
    await expect(handle(page)).toHaveCount(0);
    await page.locator('#pagerail_panel_toggle').click();
    await expect(layout(page)).toHaveAttribute('data-panel', 'open');
    await expect(page.locator('#pagerail_panel')).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
    await page.locator('#pagerail_panel_toggle').click();
    await page.mouse.click(900, 400);
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
    await expect(getBlock(page, 'rail_toggle_display')).toContainText('Panel: closed by scrim');
  });

  test('turns the rail into a tab bar with More on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('#pagerail_rail')).toHaveCount(0);
    const bar = page.locator('#pagerail_tab_bar');
    await expect(bar).toContainText('Controls');
    await expect(bar).not.toContainText('Audit');
    await bar.locator('.lf-rail-item').filter({ hasText: 'More' }).click();
    const sheet = page.locator('#pagerail_more_sheet');
    await expect(sheet).toContainText('Audit');
    await expect(sheet).toContainText('Alerts');
    await expect(sheet).toContainText('Alex Brown');
  });

  test("a place's shortcut opens it on a phone when it is in the More sheet", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('#pagerail_tab_bar')).not.toContainText('Audit');
    await page.keyboard.press('Alt+5');
    await expect(getBlock(page, 'rail_place_display')).toContainText('Place clicked: rail_audit');
  });

  test('puts the switchers in a sheet on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(page.locator('#pagerail_bar')).toContainText('All frameworks');
    await expect(page.locator('#pagerail_bar')).toContainText('Access control');
    await expect(getBlock(page, 'rail_header_button')).toHaveCount(0);
    await page.locator('#pagerail_context').click();
    const sheet = page.locator('#pagerail_context_sheet');
    await expect(sheet).toContainText('POPIA');
    await expect(sheet).toContainText('Northwind Holdings');
    await sheet.locator('.lf-rail-switcher-row').filter({ hasText: 'POPIA' }).click();
    await expect(getBlock(page, 'rail_switch_display')).toContainText('Switched: lens:popia');
  });

  test('opens and closes the panel drawer on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
    await page.locator('#pagerail_panel_toggle').click();
    await expect(layout(page)).toHaveAttribute('data-panel', 'open');
    await expect(page.locator('#pagerail_panel')).toContainText('Controls');
    await page.locator('#pagerail_panel_close').click();
    await expect(layout(page)).toHaveAttribute('data-panel', 'closed');
  });
});
