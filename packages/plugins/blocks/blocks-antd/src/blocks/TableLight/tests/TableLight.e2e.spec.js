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

// TableLight renders a div with id={blockId} around an antd Table. Body rows carry data-row-key
// and cells data-col-key.
const getTable = (page, blockId) => page.locator(`[id="${blockId}"]`);
const getRows = (page, blockId) => getTable(page, blockId).locator('tbody tr[data-row-key]');
const getCell = (page, blockId, rowIndex, key) =>
  getRows(page, blockId).nth(rowIndex).locator(`td[data-col-key="${key}"]`);
const getHeader = (page, blockId, title) =>
  getTable(page, blockId).locator('thead th', { hasText: title });
const columnTexts = (page, blockId, key) =>
  getTable(page, blockId).locator(`tbody tr[data-row-key] td[data-col-key="${key}"]`);

test.describe('TableLight Block', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'tablelight');
  });

  // ============================================
  // BASIC RENDERING
  // ============================================

  test('renders rows, cells and humanised header titles', async ({ page }) => {
    await expect(getTable(page, 'tl_basic').locator('.ant-table')).toBeVisible();
    await expect(getRows(page, 'tl_basic')).toHaveCount(3);
    await expect(getHeader(page, 'tl_basic', 'First name')).toBeVisible();
    await expect(getHeader(page, 'tl_basic', 'Home city').locator('i')).toHaveText('city');
    await expect(getCell(page, 'tl_basic', 1, 'first_name')).toHaveText('Bob');
    await expect(getCell(page, 'tl_basic', 1, 'age')).toHaveText('30');
    await expect(getRows(page, 'tl_basic').nth(0)).toHaveClass(/lf-table-row/);
  });

  test('aligns number columns to the end', async ({ page }) => {
    await expect(getCell(page, 'tl_basic', 0, 'age').locator('.lf-table-cell')).toHaveCSS(
      'text-align',
      'end'
    );
  });

  test('headers keep the sort icon next to the title, before it in end-aligned columns', async ({
    page,
  }) => {
    const boxes = async (title) =>
      getHeader(page, 'tl_sort', title).evaluate((th) => {
        const box = (selector) => th.querySelector(selector).getBoundingClientRect();
        return { title: box('.ant-table-column-title'), sorter: box('.ant-table-column-sorter') };
      });
    const name = await boxes('Name');
    expect(name.sorter.left - name.title.right).toBeGreaterThanOrEqual(0);
    expect(name.sorter.left - name.title.right).toBeLessThanOrEqual(6);
    const amount = await boxes('Amount');
    expect(amount.title.left - amount.sorter.right).toBeGreaterThanOrEqual(0);
    expect(amount.title.left - amount.sorter.right).toBeLessThanOrEqual(6);
  });

  test('draws the same outer border and radius as Table', async ({ page }) => {
    const container = getTable(page, 'tl_basic').locator('.ant-table-container');
    await expect(container).toHaveCSS('border-top-width', '1px');
    await expect(container).toHaveCSS('border-top-left-radius', '8px');
  });

  // ============================================
  // TIER 0 CELL TYPES
  // ============================================

  test('renders text, number, currency, percent, date and datetime cells', async ({ page }) => {
    await expect(getCell(page, 'tl_types', 0, 'text')).toHaveText('Plain text');
    await expect(getCell(page, 'tl_types', 0, 'number')).toHaveText('1,234.6');
    await expect(getCell(page, 'tl_types', 0, 'currency')).toHaveText('€99.50');
    await expect(getCell(page, 'tl_types', 0, 'percent')).toHaveText('25%');
    await expect(getCell(page, 'tl_types', 0, 'date')).toHaveText('2026-03-01');
    await expect(getCell(page, 'tl_types', 0, 'datetime')).toHaveText('1 Mar 2026 10:05');
  });

  test('renders boolean, tag, tags and status cells', async ({ page }) => {
    await expect(getCell(page, 'tl_types', 0, 'boolean')).toHaveText('Active');
    const tag = getCell(page, 'tl_types', 0, 'tag').locator('.lf-table-tag');
    await expect(tag).toHaveText('Won');
    expect(await tag.getAttribute('style')).toContain('--ant-color-success');
    const tags = getCell(page, 'tl_types', 0, 'tags');
    await expect(tags.locator('.lf-table-tag')).toHaveText(['alpha', 'beta']);
    await expect(tags.locator('.lf-table-more')).toHaveText('+1');
    const status = getCell(page, 'tl_types', 0, 'status');
    await expect(status).toHaveText('Open');
    await expect(status.locator('.lf-table-status-dot')).toBeVisible();
  });

  test('renders avatar and people cells as plain DOM', async ({ page }) => {
    const avatar = getCell(page, 'tl_types', 0, 'avatar');
    await expect(avatar.locator('.lf-table-avatar')).toHaveText('JD');
    await expect(avatar.locator('.lf-table-person-name')).toHaveText('Jane Doe');
    await expect(avatar.locator('.ant-avatar')).toHaveCount(0);
    const people = getCell(page, 'tl_types', 0, 'people').locator('.lf-table-people');
    await expect(people.locator('.lf-table-avatar')).toHaveCount(4);
    await expect(people.locator('.lf-table-people-more')).toHaveText('+1');
    await expect(people).toHaveAttribute('title', 'Ann Lee, Bob Stone, Cy Dunn, Di Park');
  });

  test('renders link, email, phone, url and relation cells as real links', async ({ page }) => {
    await expect(getCell(page, 'tl_types', 0, 'link').locator('a')).toHaveAttribute(
      'href',
      /\/button\?id=r1$/
    );
    await expect(getCell(page, 'tl_types', 0, 'email').locator('a')).toHaveAttribute(
      'href',
      'mailto:jane@example.com'
    );
    await expect(getCell(page, 'tl_types', 0, 'phone').locator('a')).toHaveAttribute(
      'href',
      'tel:+27215550100'
    );
    const url = getCell(page, 'tl_types', 0, 'url').locator('a');
    await expect(url).toHaveAttribute('href', 'https://example.com');
    await expect(url).toHaveAttribute('target', '_blank');
    const relation = getCell(page, 'tl_types', 0, 'relation').locator('a.lf-table-chip');
    await expect(relation).toHaveText('Acme Ltd');
    await expect(relation).toHaveAttribute('href', /\/button\?_id=c1$/);
  });

  test('renders a url with another scheme as text, not a link', async ({ page }) => {
    const cell = getCell(page, 'tl_unsafe_url', 0, 'url');
    await expect(cell).toHaveText('javascript:alert(1)');
    await expect(cell.locator('a')).toHaveCount(0);
  });

  test('renders progress, rating, image, html and json cells', async ({ page }) => {
    const progress = getCell(page, 'tl_types', 0, 'progress');
    await expect(progress.locator('.lf-table-progress-text')).toHaveText('40%');
    await expect(progress.locator('.lf-table-progress-fill')).toHaveAttribute(
      'style',
      /width: 40%/
    );
    await expect(
      getCell(page, 'tl_types', 0, 'rating').locator('.lf-table-rating')
    ).toHaveAttribute('aria-label', '4 of 5');
    await expect(getCell(page, 'tl_types', 0, 'rating').locator('.lf-table-rating-on')).toHaveText(
      '★★★★'
    );
    await expect(getCell(page, 'tl_types', 0, 'image').locator('img')).toHaveAttribute(
      'loading',
      'lazy'
    );
    await expect(getCell(page, 'tl_types', 0, 'html').locator('b')).toHaveText('Bold');
    await expect(getCell(page, 'tl_types', 0, 'json')).toHaveText('{"a":1}');
  });

  // ============================================
  // SORTING
  // ============================================

  test('sorts a number column numerically, then descending, then clears', async ({ page }) => {
    const amounts = columnTexts(page, 'tl_sort', 'amount');
    await expect(amounts).toHaveText(['10', '9', '100', '—']);
    await getHeader(page, 'tl_sort', 'Amount').click();
    await expect(amounts).toHaveText(['9', '10', '100', '—']);
    await expect(getHeader(page, 'tl_sort', 'Amount')).toHaveAttribute('aria-sort', 'ascending');
    await getHeader(page, 'tl_sort', 'Amount').click();
    await expect(amounts).toHaveText(['100', '10', '9', '—']);
    await expect(getHeader(page, 'tl_sort', 'Amount')).toHaveAttribute('aria-sort', 'descending');
    await getHeader(page, 'tl_sort', 'Amount').click();
    await expect(amounts).toHaveText(['10', '9', '100', '—']);
  });

  test('sorts a text column without case', async ({ page }) => {
    await getHeader(page, 'tl_sort', 'Name').click();
    await expect(columnTexts(page, 'tl_sort', 'name')).toHaveText([
      'Apple',
      'banana',
      'cherry',
      'date',
    ]);
  });

  test('does not sort columns that turn sorting off', async ({ page }) => {
    await expect(
      getHeader(page, 'tl_sort', 'Note').locator('.ant-table-column-sorters')
    ).toHaveCount(0);
    await getHeader(page, 'tl_sort_off', 'Name').click();
    await expect(columnTexts(page, 'tl_sort_off', 'name')).toHaveText(['b', 'a']);
  });

  // ============================================
  // PAGINATION
  // ============================================

  test('shows the pager only when rows exceed the page size', async ({ page }) => {
    await expect(getRows(page, 'tl_page_auto')).toHaveCount(5);
    const pager = getTable(page, 'tl_page_auto').locator('.ant-pagination');
    await expect(pager).toBeVisible();
    await pager.locator('.ant-pagination-item-2').click();
    await expect(getRows(page, 'tl_page_auto')).toHaveCount(2);
    await expect(getRows(page, 'tl_page_single')).toHaveCount(3);
    await expect(getTable(page, 'tl_page_single').locator('.ant-pagination')).toHaveCount(0);
  });

  test('pagination false shows every row', async ({ page }) => {
    await expect(getRows(page, 'tl_page_off')).toHaveCount(7);
    await expect(getTable(page, 'tl_page_off').locator('.ant-pagination')).toHaveCount(0);
  });

  // ============================================
  // SUMMARY
  // ============================================

  test('renders the summary footer from column aggregates', async ({ page }) => {
    const summary = getTable(page, 'tl_summary').locator('.lf-table-summary-row');
    await expect(summary.locator('[data-aggregate="count"]')).toHaveText('Count4');
    await expect(summary.locator('[data-aggregate="sum"] .lf-table-summary-value')).toHaveText(
      '$30.00'
    );
    await expect(summary.locator('[data-aggregate="avg"] .lf-table-summary-value')).toHaveText('5');
    await expect(
      summary.locator('[data-aggregate="percentEmpty"] .lf-table-summary-value')
    ).toHaveText('50%');
  });

  // ============================================
  // BUTTONS AND MENU
  // ============================================

  test('a cell button fires its event with the row payload and not onRowClick', async ({
    page,
  }) => {
    await getCell(page, 'tl_actions', 1, 'actions').getByRole('button', { name: 'Edit' }).click();
    await expect(getBlock(page, 'tl_actions_display')).toHaveText(
      'row=none event=onEdit Edit Bob p2 0'
    );
  });

  test('an icon-only button is labelled by its title and reports its index', async ({ page }) => {
    await getCell(page, 'tl_actions', 0, 'actions').getByRole('button', { name: 'Remove' }).click();
    await expect(getBlock(page, 'tl_actions_display')).toHaveText(
      'row=none event=onRemove Alice 1'
    );
  });

  test('a button hidden by a when condition is not rendered', async ({ page }) => {
    await expect(
      getCell(page, 'tl_actions', 0, 'actions').getByRole('button', { name: 'Unlock' })
    ).toBeVisible();
    await expect(
      getCell(page, 'tl_actions', 1, 'actions').getByRole('button', { name: 'Unlock' })
    ).toHaveCount(0);
  });

  test('showOn hover buttons appear when the row is hovered', async ({ page }) => {
    const actions = getCell(page, 'tl_actions', 0, 'hover_actions').locator('.lf-table-actions');
    await expect(actions).toHaveCSS('opacity', '0');
    await getCell(page, 'tl_actions', 0, 'name').hover();
    await expect(actions).toHaveCSS('opacity', '1');
  });

  test('a menu item fires its event with the row payload and not onRowClick', async ({ page }) => {
    const trigger = getCell(page, 'tl_actions', 0, 'more').locator('.lf-table-menu-trigger');
    await expect(page.locator('.ant-dropdown')).toHaveCount(0);
    await trigger.click();
    const menu = page.locator('.ant-dropdown:not(.ant-dropdown-hidden)');
    await expect(menu.getByRole('menuitem')).toHaveText(['Archive']);
    await menu.getByRole('menuitem', { name: 'Archive' }).click();
    await expect(getBlock(page, 'tl_actions_display')).toHaveText(
      'row=none event=onArchive Archive Alice p1 0'
    );
  });

  test('a menu shows the items the row does not hide', async ({ page }) => {
    await getCell(page, 'tl_actions', 1, 'more').locator('.lf-table-menu-trigger').click();
    const menu = page.locator('.ant-dropdown:not(.ant-dropdown-hidden)');
    await expect(menu.getByRole('menuitem')).toHaveText(['Archive', 'Secret']);
  });

  // ============================================
  // CLICKS AND LINKS
  // ============================================

  test('a row click fires onRowClick and onCellClick with their payloads', async ({ page }) => {
    await getCell(page, 'tl_clicks', 1, 'age').click();
    await expect(getBlock(page, 'tl_clicks_display')).toHaveText('row=Bob k2 1 cell=age age 30');
  });

  test('a row click after sorting reports the source index', async ({ page }) => {
    await getHeader(page, 'tl_clicks', 'Age').click();
    await getHeader(page, 'tl_clicks', 'Age').click();
    await getCell(page, 'tl_clicks', 1, 'name').click();
    await expect(getBlock(page, 'tl_clicks_display')).toHaveText(
      'row=Alice k1 0 cell=name name Alice'
    );
  });

  test('a link cell navigates and does not fire onRowClick', async ({ page }) => {
    await getCell(page, 'tl_clicks', 0, 'profile').locator('a').click();
    await expect(page).toHaveURL(/\/button\?id=k1$/);
  });

  test('dragging to select text does not fire onRowClick', async ({ page }) => {
    const cell = getCell(page, 'tl_clicks', 0, 'name');
    const box = await cell.boundingBox();
    await page.mouse.move(box.x + 4, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 4, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    expect(await page.evaluate(() => window.getSelection().toString())).toContain('Alice');
    await expect(getBlock(page, 'tl_clicks_display')).toHaveText('row=none cell=none');
    // A click that clears the selection is an ordinary click.
    await cell.click();
    await expect(getBlock(page, 'tl_clicks_display')).toHaveText(
      'row=Alice k1 0 cell=name name Alice'
    );
  });

  test('a rowLink row navigates on a plain click', async ({ page }) => {
    await expect(getRows(page, 'tl_row_link').nth(0)).toHaveClass(/lf-table-row-clickable/);
    await getCell(page, 'tl_row_link', 1, 'name').click();
    await expect(page).toHaveURL(/\/button\?id=l2$/);
  });

  test('a rowLink row opens a new tab on a modified click', async ({ page, context }) => {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      getCell(page, 'tl_row_link', 0, 'name').click({ modifiers: ['ControlOrMeta'] }),
    ]);
    await expect(newPage).toHaveURL(/\/button\?id=l1$/);
    await expect(page).toHaveURL(/\/tablelight$/);
  });

  test('a rowLink row opens a new tab on a middle click', async ({ page, context }) => {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      getCell(page, 'tl_row_link', 1, 'name').click({ button: 'middle' }),
    ]);
    await expect(newPage).toHaveURL(/\/button\?id=l2$/);
    await expect(page).toHaveURL(/\/tablelight$/);
  });

  test('with onRowClick a plain click runs the event and a modified click opens the link', async ({
    page,
    context,
  }) => {
    await getCell(page, 'tl_row_link_click', 0, 'name').click();
    await expect(getBlock(page, 'tl_peek_display')).toHaveText('peek=Peek one');
    await expect(page).toHaveURL(/\/tablelight$/);
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      getCell(page, 'tl_row_link_click', 0, 'name').click({ modifiers: ['ControlOrMeta'] }),
    ]);
    await expect(newPage).toHaveURL(/\/button\?id=m1$/);
  });

  // ============================================
  // RULES, HTML, EMPTY, UNSUPPORTED KEYS
  // ============================================

  test('cell rules colour values and row rules add classes', async ({ page }) => {
    const high = getCell(page, 'tl_rules', 0, 'score').locator('.lf-table-cell');
    expect(await high.getAttribute('style')).toContain('--ant-color-success');
    const low = getCell(page, 'tl_rules', 1, 'score').locator('.lf-table-cell');
    await expect(low).toHaveCSS('color', 'rgb(255, 0, 0)');
    await expect(low).toHaveClass(/tl-low-score/);
    const mid = getCell(page, 'tl_rules', 2, 'score').locator('.lf-table-cell');
    await expect(mid).not.toHaveAttribute('style', /color/);
    await expect(getRows(page, 'tl_rules').nth(1)).toHaveClass(/tl-overdue-row/);
    await expect(getRows(page, 'tl_rules').nth(0)).not.toHaveClass(/tl-overdue-row/);
  });

  test('html template cells escape values and render the template markup', async ({ page }) => {
    const cell = getCell(page, 'tl_html', 0, 'name');
    await expect(cell.locator('b.tl-name')).toHaveText('<i>Alice</i>');
    await expect(cell.locator('i')).toHaveCount(0);
    await expect(cell).toHaveText('<i>Alice</i> from Paarl');
  });

  test('shows the empty text when there are no rows', async ({ page }) => {
    await expect(getTable(page, 'tl_empty').locator('.ant-table-placeholder')).toContainText(
      'No orders yet'
    );
  });

  test('loading without rows shows type-shaped skeleton rows under the real header', async ({
    page,
  }) => {
    const table = getTable(page, 'tl_loading');
    await expect(table).toHaveAttribute('data-loading-state', 'initial');
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(table.locator('thead th')).toHaveText(['Number', 'Customer', 'Status', 'Total']);
    // A 240px body under a 47px header: five 47px rows fill it.
    await expect(table.locator('tbody tr[data-skeleton]')).toHaveCount(5);
    await expect(table.locator('tbody tr[data-row-key]')).toHaveCount(0);
    const row = table.locator('tbody tr[data-skeleton]').first();
    await expect(row.locator('[data-shape="person"]')).toHaveCount(1);
    await expect(row.locator('[data-shape="pill"]')).toHaveCount(1);
    await expect(row.locator('[data-shape="number"][data-align="end"]')).toHaveCount(1);
    await expect(table.locator('.ant-spin-spinning')).toHaveCount(0);
    await expect(table.locator('.ant-table-placeholder')).toHaveCount(0);
  });

  test('loading with rows keeps them and runs a progress bar under the header', async ({
    page,
  }) => {
    const table = getTable(page, 'tl_loading_rows');
    await expect(table).toHaveAttribute('data-loading-state', 'refreshing');
    await expect(getRows(page, 'tl_loading_rows')).toHaveText(['A-1']);
    const bar = table.locator('.lf-table-light-bar');
    await expect(bar).toBeVisible();
    const barTop = (await bar.boundingBox()).y;
    const headerBottom = await table
      .locator('thead')
      .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(Math.abs(barTop + 2 - headerBottom)).toBeLessThan(1);
    await expect(table.locator('.ant-spin-spinning')).toHaveCount(0);
  });

  test('a Table-only key stops the block from rendering', async ({ page }) => {
    await expect(getBlock(page, 'tl_basic')).toBeVisible();
    await expect(getTable(page, 'tl_unsupported')).toHaveCount(0);
  });
});
