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

import fs from 'fs';
import { test, expect } from '@playwright/test';
import { getBlock } from '@lowdefy/block-dev-e2e';

import openTablePage from '../../../../e2e/openTablePage.js';

const toggle = (page, blockId, key) =>
  getBlock(page, blockId).locator(`[data-lf-column-group-toggle="${key}"]`);
const value = (page) => getBlock(page, 'cg_value');
const manager = (page) => page.locator('[data-lf-column-manager]');

function headerKeys(page, blockId) {
  return getBlock(page, blockId)
    .locator('[data-lf-header]')
    .evaluateAll((cells) => cells.map((element) => element.dataset.colKey));
}

test.describe('Table collapsible column groups', () => {
  test.beforeEach(async ({ page }) => {
    await openTablePage(page, 'table-column-groups');
  });

  test('a collapsed group shows its closed and always columns, and the chevron expands it', async ({
    page,
  }) => {
    await expect.poll(() => headerKeys(page, 'cg')).toEqual(['project', 'total', 'completed']);
    await expect(value(page)).toHaveText('collapsed=["outcomes"]');
    const chevron = toggle(page, 'cg', 'outcomes');
    await expect(chevron).toHaveAttribute('aria-expanded', 'false');
    await expect(chevron).toHaveAttribute('aria-label', 'Expand Outcomes');
    await chevron.click();
    await expect(chevron).toHaveAttribute('aria-expanded', 'true');
    await expect(value(page)).toHaveText('collapsed=[]');
    await expect
      .poll(() => headerKeys(page, 'cg'))
      .toEqual(['project', 'completed', 'opted_out', 'not_reached']);
    await expect(
      getBlock(page, 'cg').locator('.lf-table-body [data-row-key="1"] [data-col-key="not_reached"]')
    ).toHaveText('3');
    // The group header spans the columns it shows.
    const groupBox = await getBlock(page, 'cg').locator('[data-group="outcomes"]').boundingBox();
    expect(Math.round(groupBox.width)).toBe(110 + 110 + 120);
  });

  test('Enter on the focused chevron toggles the group', async ({ page }) => {
    const chevron = toggle(page, 'cg', 'outcomes');
    await chevron.focus();
    await page.keyboard.press('Enter');
    await expect(chevron).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Enter');
    await expect(chevron).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(() => headerKeys(page, 'cg')).toEqual(['project', 'total', 'completed']);
  });

  test('the collapsed groups persist with the view and survive a reload', async ({ page }) => {
    await toggle(page, 'cg', 'outcomes').click();
    await expect(value(page)).toHaveText('collapsed=[]');
    const stored = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('lowdefy-table:e2e_column_groups'))
    );
    expect(stored.view).toEqual({ collapsedColumnGroups: [] });
    await page.reload();
    await expect(value(page)).toHaveText('collapsed=[]');
    await expect
      .poll(() => headerKeys(page, 'cg'))
      .toEqual(['project', 'completed', 'opted_out', 'not_reached']);
  });

  test('exportCsv exports only the displayed columns', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#cg_export').click();
    const download = await downloadPromise;
    const content = fs.readFileSync(await download.path(), 'utf8').replace(/^\ufeff/, '');
    expect(content.split('\r\n')).toEqual(['Project,Total,Completed', 'Alpha,10,4', 'Beta,20,9']);
  });

  test('search reads only the displayed columns', async ({ page }) => {
    const search = getBlock(page, 'cg').locator('[data-lf-toolbar-search] input');
    const rows = getBlock(page, 'cg').locator('.lf-table-body [role="row"]');
    await search.fill('zulu');
    await expect(rows).toHaveCount(0);
    await toggle(page, 'cg', 'outcomes').click();
    await search.fill('yankee');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Beta');
  });

  test('the column picker lists the columns a group hides as unavailable', async ({ page }) => {
    await page.locator('#cg_open_manager').click();
    await expect(manager(page)).toBeVisible();
    const item = (key) => manager(page).locator(`[data-lf-manager-item][data-col-key="${key}"]`);
    await expect(manager(page)).toContainText('Hidden by a column group');
    await expect(item('opted_out')).toHaveAttribute('data-unavailable', '');
    await expect(item('opted_out').locator('input[type="checkbox"]')).toBeDisabled();
    await expect(item('total')).not.toHaveAttribute('data-unavailable', '');
    await expect(item('total').locator('input[type="checkbox"]')).toBeChecked();
  });

  test('collapsing an outer group hides an inner group shown only while it is open', async ({
    page,
  }) => {
    await expect.poll(() => headerKeys(page, 'cg_nested')).toEqual(['name', 'sum']);
    await toggle(page, 'cg_nested', 'all').click();
    await expect
      .poll(() => headerKeys(page, 'cg_nested'))
      .toEqual(['name', 'detail_total', 'detail_a']);
    await toggle(page, 'cg_nested', 'detail').click();
    await expect.poll(() => headerKeys(page, 'cg_nested')).toEqual(['name', 'detail_total']);
    await toggle(page, 'cg_nested', 'all').click();
    await expect.poll(() => headerKeys(page, 'cg_nested')).toEqual(['name', 'sum']);
  });
});
