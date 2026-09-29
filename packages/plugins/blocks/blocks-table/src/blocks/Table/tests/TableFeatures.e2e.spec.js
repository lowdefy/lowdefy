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
const bodyRows = (page, blockId) => getBlock(page, blockId).locator('.lf-table-body [role="row"]');
const row = (page, blockId, rowKey) =>
  getBlock(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const cell = (page, blockId, rowKey, key) =>
  row(page, blockId, rowKey).locator(`[data-col-key="${key}"]`);

async function width(locator) {
  return Math.round((await locator.boundingBox()).width);
}

test.describe('Table features shared with TableLight', () => {
  test.beforeEach(async ({ page }) => {
    await openTablePage(page, 'table-features');
    await expect(bodyRows(page, 'tf_groups')).toHaveCount(1);
  });

  test('header groups render as rows above the column headers', async ({ page }) => {
    const groups = getBlock(page, 'tf_groups').locator('.lf-table-group-row');
    await expect(groups).toHaveCount(2);
    const contact = groups.nth(0).locator('[data-group]');
    await expect(contact).toHaveText('Contact');
    await expect(contact.locator('.lf-table-header-tooltip')).toBeVisible();
    await expect(groups.nth(1).locator('[data-group]')).toHaveText('Phone');
    // A group spans exactly its columns.
    expect(await width(contact)).toBe(200 + 120 + 130);
    expect(await width(groups.nth(1).locator('[data-group]'))).toBe(120 + 130);
    const contactBox = await contact.boundingBox();
    const emailBox = await header(page, 'tf_groups', 'email').boundingBox();
    expect(Math.round(contactBox.x)).toBe(Math.round(emailBox.x));
    await expect(header(page, 'tf_groups', 'mobile')).toHaveText('Mobile');
    await expect(getBlock(page, 'tf_groups').locator('[role="grid"]')).toHaveAttribute(
      'aria-rowcount',
      '4'
    );
  });

  test('the summary footer shows aggregates over every row and stays in view', async ({ page }) => {
    const summary = getBlock(page, 'tf_summary').locator('.lf-table-summary-row');
    await expect(summary.locator('[data-col-key="name"]')).toHaveText('Count30');
    await expect(summary.locator('[data-col-key="amount"]')).toHaveText('Sum$465.00');
    const scroller = getBlock(page, 'tf_summary').locator('.lf-table-scroller');
    await scroller.scrollIntoViewIfNeeded();
    const scrollerBox = await scroller.boundingBox();
    const summaryBox = await summary.boundingBox();
    expect(
      Math.abs(summaryBox.y + summaryBox.height - (scrollerBox.y + scrollerBox.height))
    ).toBeLessThan(2);
    await scroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    // The last row scrolls fully above the footer.
    await expect(cell(page, 'tf_summary', 30, 'name')).toHaveText('Row 30');
    const lastBox = await row(page, 'tf_summary', 30).boundingBox();
    const footerBox = await summary.boundingBox();
    expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(footerBox.y + 1);
  });

  test('the summary footer shows for view aggregates without column aggregates', async ({
    page,
  }) => {
    const summary = getBlock(page, 'tf_summary_view').locator('.lf-table-summary-row');
    await expect(summary.locator('[data-col-key="amount"]')).toContainText('7');
  });

  test('pagination shows pages of pageSize with a pager', async ({ page }) => {
    await expect(bodyRows(page, 'tf_pages')).toHaveCount(5);
    const pager = getBlock(page, 'tf_pages').locator('.ant-pagination');
    await expect(pager).toBeVisible();
    await pager.locator('.ant-pagination-item-3').click();
    await expect(bodyRows(page, 'tf_pages')).toHaveCount(2);
    await expect(cell(page, 'tf_pages', 11, 'n')).toHaveText('11');
    // Sorting sorts every page, then shows the current one.
    await header(page, 'tf_pages', 'n').click();
    await header(page, 'tf_pages', 'n').click();
    await expect(cell(page, 'tf_pages', 2, 'n')).toHaveText('2');
    await expect(cell(page, 'tf_pages', 1, 'n')).toHaveText('1');
  });

  test('wrapped columns give rows their content height', async ({ page }) => {
    const shortRow = await row(page, 'tf_wrap', 1).boundingBox();
    const longRow = await row(page, 'tf_wrap', 2).boundingBox();
    expect(Math.round(shortRow.height)).toBe(40);
    expect(longRow.height).toBeGreaterThan(60);
    // The next row starts where the tall row ends.
    const nextRow = await row(page, 'tf_wrap', 3).boundingBox();
    expect(Math.abs(nextRow.y - (longRow.y + longRow.height))).toBeLessThan(1.5);
    await expect(cell(page, 'tf_wrap', 2, 'note').locator('.lf-table-cell')).toHaveClass(
      /lf-table-cell-wrap/
    );
  });

  test('view.wrap wraps text columns, and the toolbar Wrap toggle turns it off', async ({
    page,
  }) => {
    const noteCell = cell(page, 'tf_view_wrap', 2, 'note').locator('.lf-table-cell');
    await expect(noteCell).toHaveClass(/lf-table-cell-wrap/);
    await expect(cell(page, 'tf_view_wrap', 2, 'amount').locator('.lf-table-cell')).toHaveClass(
      /lf-table-cell-nowrap/
    );
    await expect
      .poll(async () => (await row(page, 'tf_view_wrap', 2).boundingBox()).height)
      .toBeGreaterThan(60);
    const toggle = getBlock(page, 'tf_view_wrap').locator('[data-lf-toolbar-wrap]');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(getBlock(page, 'tf_view_wrap_value')).toHaveText('wrap=false');
    await expect(noteCell).toHaveClass(/lf-table-cell-nowrap/);
    await expect
      .poll(async () => Math.round((await row(page, 'tf_view_wrap', 2).boundingBox()).height))
      .toBe(40);
    await toggle.click();
    await expect(getBlock(page, 'tf_view_wrap_value')).toHaveText('wrap=true');
    await expect(noteCell).toHaveClass(/lf-table-cell-wrap/);
  });

  test('view.pageSize sets the rows per page', async ({ page }) => {
    await expect(bodyRows(page, 'tf_view_pages')).toHaveCount(3);
    await expect(getBlock(page, 'tf_view_pages_value')).toHaveText('pageSize=3');
    const pager = getBlock(page, 'tf_view_pages').locator('.ant-pagination');
    await expect(pager.locator('.ant-pagination-item-4')).toBeVisible();
    await page.locator('#tf_view_pages_four').click();
    await expect(bodyRows(page, 'tf_view_pages')).toHaveCount(4);
    await expect(pager.locator('.ant-pagination-item-4')).toHaveCount(0);
  });

  test('size sets the density and bordered draws cell borders', async ({ page }) => {
    expect(Math.round((await row(page, 'tf_compact', 1).boundingBox()).height)).toBe(32);
    await expect(getBlock(page, 'tf_compact').locator('.lf-table')).toHaveAttribute(
      'data-bordered',
      ''
    );
    await expect(cell(page, 'tf_compact', 1, 'name')).toHaveCSS('border-right-width', '1px');
    await expect(getBlock(page, 'tf_compact').locator('.lf-table-empty-state')).toHaveCount(0);
  });

  test('emptyText renders html', async ({ page }) => {
    await expect(getBlock(page, 'tf_empty').locator('.lf-table-empty-state b')).toHaveText('yet');
  });

  test('with onRowClick, a plain click runs it and a modified click follows rowLink', async ({
    page,
    context,
  }) => {
    await cell(page, 'tf_link_click', 3, 'name').click();
    await expect(getBlock(page, 'tf_peek')).toHaveText('peek=Bob');
    await expect(page).toHaveURL(/\/table-features$/);
    const popupPromise = context.waitForEvent('page');
    await cell(page, 'tf_link_click', 4, 'name').click({ modifiers: ['ControlOrMeta'] });
    const popup = await popupPromise;
    await popup.waitForLoadState();
    expect(popup.url()).toMatch(/\/table-link-target\?id=4$/);
  });

  test('Enter on a focused row follows rowLink', async ({ page }) => {
    await header(page, 'tf_link_enter', 'name').click();
    await expect(header(page, 'tf_link_enter', 'name')).toHaveAttribute('aria-sort', 'ascending');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/table-link-target\?id=2$/);
  });

  test('showOn hover buttons mount and show on the hovered or focused row only', async ({
    page,
  }) => {
    const first = cell(page, 'tf_hover', 1, 'actions').locator('.lf-table-actions');
    const second = cell(page, 'tf_hover', 2, 'actions').locator('.lf-table-actions');
    // Tier 1: the buttons are not mounted until their row is hovered.
    await expect(first).toHaveCount(0);
    await cell(page, 'tf_hover', 1, 'name').hover();
    await expect(first).toHaveCSS('opacity', '1');
    await expect(first.locator('button')).toHaveText('Open');
    await expect(second).toHaveCount(0);
    await cell(page, 'tf_hover', 2, 'name').hover();
    await expect(second).toHaveCSS('opacity', '1');
    await expect(first).toHaveCount(0);
    // Keyboard focus in a row mounts them too.
    await page.mouse.move(0, 0);
    await cell(page, 'tf_hover', 1, 'name').focus();
    await expect(first).toHaveCSS('opacity', '1');
  });

  test('rich cells scrolled in fast show their text, then render in full once the scroll settles', async ({
    page,
  }) => {
    const scroller = getBlock(page, 'tf_fast').locator('.lf-table-scroller');
    await scroller.scrollIntoViewIfNeeded();
    const placeholders = await scroller.evaluate(async (element) => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      let seen = 0;
      for (let i = 1; i <= 20; i++) {
        element.scrollTop = i * 4000;
        await frame();
        await frame();
        const cells = element.querySelectorAll('.lf-table-body [data-col-key="stage"]');
        cells.forEach((cellElement) => {
          if (cellElement.querySelector('.lf-table-tag') === null) seen += 1;
        });
      }
      return seen;
    });
    // Rows that came into view mid-scroll showed the text placeholder.
    expect(placeholders).toBeGreaterThan(0);
    const visible = getBlock(page, 'tf_fast').locator(
      '.lf-table-body [role="row"] [data-col-key="stage"]'
    );
    await expect(visible.first().locator('.lf-table-tag')).toBeVisible();
    await expect
      .poll(() =>
        visible.evaluateAll((cells) =>
          cells.every((cellElement) => cellElement.querySelector('.lf-table-tag'))
        )
      )
      .toBe(true);
    await expect(visible.first()).toHaveText(/Won|Lost/);
  });
});
