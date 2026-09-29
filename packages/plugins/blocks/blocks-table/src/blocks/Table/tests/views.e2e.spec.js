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

// View tabs are antd Tabs; each label is [data-lf-view-tab=<id>] with data-dirty while the
// current view differs from the saved one. The unsaved changes strip is [data-lf-view-actions].
const tab = (page, id) => getBlock(page, 'vw').locator(`[data-lf-view-tab="${id}"]`);
const activeTab = (page) => getBlock(page, 'vw').locator('.ant-tabs-tab-active');
const strip = (page) => getBlock(page, 'vw').locator('[data-lf-view-actions]');
const density = (page, blockId, label) =>
  getBlock(page, blockId).locator('[data-lf-toolbar-density]').getByText(label, { exact: true });
const value = (page) => getBlock(page, 'vw_value');
const events = (page) => getBlock(page, 'vw_events');

test.describe('Table saved views', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'views');
    await expect(tab(page, 'all')).toBeVisible();
  });

  test('tabs show the saved views with counts, and the first view is active', async ({ page }) => {
    await expect(tab(page, 'all')).toContainText('All');
    await expect(tab(page, 'oldest').locator('[data-lf-view-count]')).toHaveText('3');
    await expect(tab(page, 'fixed')).toContainText('Fixed');
    await expect(activeTab(page)).toContainText('All');
    await expect(strip(page)).toHaveCount(0);
  });

  test('selecting a tab loads its view and fires onViewSelect', async ({ page }) => {
    await tab(page, 'oldest').click();
    await expect(activeTab(page)).toContainText('Oldest');
    await expect(value(page)).toHaveText(
      'sort=[{"key":"age","desc":true}] density=default cause=view'
    );
    // onViewSelect runs after the view commits: its actions read the new view.
    await expect(events(page)).toContainText(
      'select={"id":"oldest"} select_sort=[{"key":"age","desc":true}]'
    );
    await expect(
      getBlock(page, 'vw').locator('[data-lf-header][data-col-key="age"]')
    ).toHaveAttribute('aria-sort', 'descending');
    await expect(strip(page)).toHaveCount(0);
  });

  test('a changed view marks the tab dirty, and Discard reloads the saved view', async ({
    page,
  }) => {
    await tab(page, 'oldest').click();
    await density(page, 'vw', 'Compact').click();
    await expect(tab(page, 'oldest')).toHaveAttribute('data-dirty', '');
    await expect(strip(page)).toBeVisible();
    await strip(page).locator('[data-lf-view-action="discard"]').click();
    await expect(value(page)).toHaveText(
      'sort=[{"key":"age","desc":true}] density=default cause=view'
    );
    await expect(tab(page, 'oldest')).not.toHaveAttribute('data-dirty', '');
    await expect(strip(page)).toHaveCount(0);
  });

  test('Save fires onViewSave with the view and the active view id', async ({ page }) => {
    await tab(page, 'oldest').click();
    await density(page, 'vw', 'Compact').click();
    await strip(page).locator('[data-lf-view-action="save"]').click();
    await expect(events(page)).toContainText('"id":"oldest","title":"Oldest","shared":false');
    await expect(events(page)).toContainText('"density":"compact"');
    await expect(events(page)).toContainText('"sort":[{"key":"age","desc":true}]');
  });

  test('Save as asks for a title and fires onViewSave without an id', async ({ page }) => {
    await density(page, 'vw', 'Comfortable').click();
    await strip(page).locator('[data-lf-view-action="save-as"]').click();
    const form = page.locator('[data-lf-save-view]');
    await expect(form.locator('[data-lf-view-action="save-as-submit"]')).toBeDisabled();
    await form.getByPlaceholder('View name').fill('Roomy');
    await form.getByText('Shared').click();
    await form.locator('[data-lf-view-action="save-as-submit"]').click();
    await expect(events(page)).toContainText('"title":"Roomy","shared":true');
    await expect(events(page)).toContainText('"density":"comfortable"');
    await expect(events(page)).not.toContainText('"id"');
  });

  test('a locked view hides Save but keeps Save as', async ({ page }) => {
    await tab(page, 'fixed').click();
    await expect(value(page)).toContainText('density=compact');
    await density(page, 'vw', 'Default').click();
    await expect(strip(page)).toBeVisible();
    await expect(strip(page).locator('[data-lf-view-action="save"]')).toHaveCount(0);
    await expect(strip(page).locator('[data-lf-view-action="save-as"]')).toBeVisible();
  });

  test('Delete in the tab menu fires onViewDelete', async ({ page }) => {
    await tab(page, 'all').locator('[data-lf-view-menu]').click();
    await page.locator('.ant-dropdown-menu-item', { hasText: 'Delete view' }).click();
    await expect(events(page)).toContainText('delete={"id":"all"}');
  });

  test('changing activeView selects and loads that view', async ({ page }) => {
    await page.locator('#vw_pick_fixed').click();
    await expect(activeTab(page)).toContainText('Fixed');
    await expect(value(page)).toContainText('density=compact');
  });
});

test.describe('Table view persistence', () => {
  test('persist local keeps the view across a reload, but never the selection', async ({
    page,
  }) => {
    await navigateToTestPage(page, 'views');
    await density(page, 'persist_local', 'Compact').click();
    await getBlock(page, 'persist_local')
      .locator('.lf-table-body [data-row-key="2"] [data-lf-select-cell] input')
      .click();
    await expect(getBlock(page, 'persist_local_value')).toContainText('selected=[2]');
    const stored = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem('lowdefy-table:e2e_people'))
    );
    expect(stored).toEqual({ view: { density: 'compact' }, activeView: null });

    await page.reload();
    await expect(getBlock(page, 'persist_local_value')).toContainText('"density":"compact"');
    await expect(getBlock(page, 'persist_local_value')).toContainText('selected=[]');
    await expect(
      getBlock(page, 'persist_local').locator(
        '[data-lf-toolbar-density] .ant-segmented-item-selected'
      )
    ).toHaveText('Compact');
  });

  test('persist local ignores stored views it cannot read', async ({ page }) => {
    await navigateToTestPage(page, 'views');
    await page.evaluate(() => window.localStorage.setItem('lowdefy-table:e2e_people', '{not json'));
    await page.reload();
    await expect(getBlock(page, 'persist_local_value')).toContainText('"density":"default"');
  });

  test('persist url writes the view to the query string and restores it', async ({ page }) => {
    await navigateToTestPage(page, 'views');
    const historyLength = await page.evaluate(() => window.history.length);
    await getBlock(page, 'persist_url').locator('[data-lf-header][data-col-key="age"]').click();
    await expect(getBlock(page, 'persist_url_value')).toHaveText('sort=[{"key":"age"}]');
    await expect(page).toHaveURL(/[?&]pv=[A-Za-z0-9_-]+/);
    expect(await page.evaluate(() => window.history.length)).toBe(historyLength);

    const url = page.url();
    const fresh = await page.context().newPage();
    await fresh.goto(url);
    await expect(getBlock(fresh, 'persist_url_value')).toHaveText('sort=[{"key":"age"}]');
    await expect(
      getBlock(fresh, 'persist_url').locator('[data-lf-header][data-col-key="age"]')
    ).toHaveAttribute('aria-sort', 'ascending');

    // Back to the default view: the parameter goes away.
    await getBlock(page, 'persist_url').locator('[data-lf-header][data-col-key="age"]').click();
    await getBlock(page, 'persist_url').locator('[data-lf-header][data-col-key="age"]').click();
    await expect(getBlock(page, 'persist_url_value')).toHaveText('sort=[]');
    await expect(page).not.toHaveURL(/[?&]pv=/);
  });
});
