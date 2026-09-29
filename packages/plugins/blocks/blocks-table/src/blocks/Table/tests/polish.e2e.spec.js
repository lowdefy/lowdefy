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

// Visual checks for the Table's layout: computed styles, boxes and truncation, not pixels.
const table = (page, blockId) => getBlock(page, blockId);
const row = (page, blockId, rowKey) =>
  table(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);
const summaryCell = (page, blockId, key) =>
  table(page, blockId).locator(`.lf-table-footer [data-col-key="${key}"]`);

// Whether an element is drawn inside its clipping ancestor (the element with `overflow: hidden`).
function isInsideBox(inner, outer) {
  return (
    inner.left >= outer.left - 0.5 &&
    inner.right <= outer.right + 0.5 &&
    inner.top >= outer.top - 0.5 &&
    inner.bottom <= outer.bottom + 0.5
  );
}

function measureSummary(locator) {
  return locator.evaluate((cell) => {
    const summary = cell.querySelector('.lf-table-summary');
    const label = summary.querySelector('.lf-table-summary-label');
    const value = summary.querySelector('.lf-table-summary-value');
    const box = (element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    };
    return {
      title: summary.title,
      summary: box(summary),
      label: box(label),
      value: box(value),
      valueTruncated: value.scrollWidth > value.clientWidth,
      textOverflow: getComputedStyle(value).textOverflow,
    };
  });
}

test.describe('Table visual polish', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'polish');
    await expect(row(page, 'crm', 1)).toBeAttached();
  });

  test('summary shows its label and value when both fit', async ({ page }) => {
    const summary = await measureSummary(summaryCell(page, 'narrow', 'amount'));
    expect(isInsideBox(summary.label, summary.summary)).toBe(true);
    expect(isInsideBox(summary.value, summary.summary)).toBe(true);
    expect(summary.valueTruncated).toBe(false);
    expect(summary.title).toBe('Sum 600');
  });

  test('summary drops the label before it shortens the value', async ({ page }) => {
    const summary = await measureSummary(summaryCell(page, 'crm', 'amount'));
    expect(isInsideBox(summary.label, summary.summary)).toBe(false);
    expect(isInsideBox(summary.value, summary.summary)).toBe(true);
    expect(summary.valueTruncated).toBe(false);
    expect(summary.title).toMatch(/^Sum \$\d/);
  });

  test('summary value too wide for its column ends with an ellipsis and a title', async ({
    page,
  }) => {
    const summary = await measureSummary(summaryCell(page, 'narrow', 'big'));
    expect(isInsideBox(summary.label, summary.summary)).toBe(false);
    expect(summary.valueTruncated).toBe(true);
    expect(summary.textOverflow).toBe('ellipsis');
    expect(summary.title).toBe('Sum 6,000,000,000');
  });

  test('group header rows have one background across the whole row', async ({ page }) => {
    const groupRows = table(page, 'grouped').locator('.lf-table-body .lf-table-group-row');
    await expect(groupRows.first()).toBeAttached();
    const colours = await groupRows.evaluateAll((rows) =>
      rows.map((element) => ({
        row: getComputedStyle(element).backgroundColor,
        label: getComputedStyle(element.querySelector('.lf-table-group-label-content'))
          .backgroundColor,
        body: getComputedStyle(
          element.closest('.lf-table').querySelector('.lf-table-body [data-row-key]')
        ).backgroundColor,
      }))
    );
    colours.forEach(({ row: rowColour, label, body }) => {
      expect(rowColour).toBe(label);
      expect(rowColour).not.toBe(body);
    });
    const hovered = groupRows.first();
    await hovered.hover();
    const hover = await hovered.evaluate((element) => ({
      row: getComputedStyle(element).backgroundColor,
      label: getComputedStyle(element.querySelector('.lf-table-group-label-content'))
        .backgroundColor,
    }));
    expect(hover.row).toBe(hover.label);
    expect(hover.row).not.toBe(colours[0].row);
  });

  test('slot blocks sit side by side in the toolbar and the bulk bar', async ({ page }) => {
    await row(page, 'crm', 2).locator('input[type="checkbox"]').click();
    await expect(table(page, 'crm').locator('[data-lf-bulk-bar]')).toBeVisible();
    const groups = [
      ['crm_new', 'crm_import'],
      ['crm_end_a', 'crm_end_b'],
      ['crm_assign', 'crm_move', 'crm_delete'],
    ];
    for (const ids of groups) {
      const boxes = [];
      for (const id of ids) boxes.push(await page.locator(`#bl-${id}`).boundingBox());
      for (let i = 1; i < boxes.length; i++) {
        expect(Math.abs(boxes[i].y - boxes[0].y)).toBeLessThan(1);
        const gap = boxes[i].x - (boxes[i - 1].x + boxes[i - 1].width);
        expect(gap).toBeGreaterThanOrEqual(7.5);
        expect(gap).toBeLessThanOrEqual(8.5);
      }
    }
  });

  test('header titles line up with their column values and keep the room of the menu button', async ({
    page,
  }) => {
    const edges = await table(page, 'crm').evaluate((root) => {
      const measure = (key) => {
        const header = root.querySelector(`[data-lf-header][data-col-key="${key}"]`);
        const title = header.querySelector('.lf-table-header-title');
        const content = root.querySelector(
          `.lf-table-body [data-row-key] [data-col-key="${key}"] .lf-table-cell`
        );
        const titleBox = title.getBoundingClientRect();
        const contentBox = content.getBoundingClientRect();
        return {
          titleLeft: titleBox.left,
          titleRight: titleBox.right,
          contentLeft: contentBox.left,
          contentRight: contentBox.right,
          truncated: title.scrollWidth > title.clientWidth,
        };
      };
      return { amount: measure('amount'), win: measure('win'), owner: measure('owner') };
    });
    // End-aligned: the title ends where the values end, whatever the sort icon and menu button do.
    expect(Math.abs(edges.amount.titleRight - edges.amount.contentRight)).toBeLessThan(1);
    expect(Math.abs(edges.win.titleRight - edges.win.contentRight)).toBeLessThan(1);
    // Start-aligned: the title starts where the values start.
    expect(Math.abs(edges.owner.titleLeft - edges.owner.contentLeft)).toBeLessThan(1);
    // "Win chance" fits a 110px column once the hidden menu button reserves no room.
    expect(edges.win.truncated).toBe(false);
  });

  test('the header menu button shows over the end of a hovered header', async ({ page }) => {
    const header = table(page, 'crm').locator('[data-lf-header][data-col-key="win"]');
    const trigger = header.locator('[data-lf-header-menu]');
    await expect(trigger).toHaveCSS('opacity', '0');
    await header.hover();
    await expect(trigger).toHaveCSS('opacity', '1');
    await expect(trigger).toHaveCSS('position', 'absolute');
    await trigger.click();
    await expect(page.locator('.lf-table-header-menu .ant-dropdown-menu')).toBeVisible();
  });

  test('menu cells in the body are visible without hovering a header', async ({ page }) => {
    await expect(
      table(page, 'narrow').locator(
        '.lf-table-body [data-row-key="1"] [data-col-key="more"] button'
      )
    ).toHaveCSS('opacity', '1');
  });

  test('tag chips that do not fit the column are counted in +N instead of cut', async ({
    page,
  }) => {
    const cells = await table(page, 'crm').evaluate((root) =>
      Array.from(
        root.querySelectorAll('.lf-table-body [data-row-key] [data-col-key="labels"]')
      ).map((cell) => {
        const style = getComputedStyle(cell);
        const box = cell.getBoundingClientRect();
        const left = box.left + Number.parseFloat(style.paddingLeft);
        const right = box.right - Number.parseFloat(style.paddingRight);
        const parts = Array.from(cell.querySelectorAll('.lf-table-tag, .lf-table-more'));
        const more = cell.querySelector('.lf-table-more');
        return {
          rowKey: cell.closest('[data-row-key]').dataset.rowKey,
          chips: cell.querySelectorAll('.lf-table-tag').length,
          hidden: more ? Number(more.textContent.slice(1)) : 0,
          inside: parts.every((part) => {
            const rect = part.getBoundingClientRect();
            return rect.left >= left - 0.5 && rect.right <= right + 0.5;
          }),
          cut: Array.from(cell.querySelectorAll('.lf-table-tag')).some(
            (tag) => tag.scrollWidth > tag.clientWidth
          ),
        };
      })
    );
    // Row n has labels[(n - 1) % 5] from the page's data: 3, 1, 2, 4 and 0 values.
    const counts = [3, 1, 2, 4, 0];
    expect(cells.length).toBeGreaterThan(5);
    cells.forEach((cell) => {
      expect(cell.inside).toBe(true);
      expect(cell.cut).toBe(false);
      expect(cell.chips + cell.hidden).toBe(counts[(Number(cell.rowKey) - 1) % 5]);
    });
    expect(cells.some((cell) => cell.hidden > 0)).toBe(true);
  });
});
