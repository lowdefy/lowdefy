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

  test('stacked avatars leave the initials of every avatar uncovered', async ({ page }) => {
    const overlaps = await table(page, 'crm').evaluate((root) => {
      const result = [];
      root.querySelectorAll('.lf-table-body .lf-table-people').forEach((stack) => {
        const avatars = Array.from(stack.children);
        for (let i = 0; i < avatars.length - 1; i++) {
          const text = avatars[i].firstChild;
          if (!text || text.nodeType !== Node.TEXT_NODE) continue;
          const range = document.createRange();
          range.selectNodeContents(avatars[i]);
          const glyphs = range.getBoundingClientRect();
          const next = avatars[i + 1];
          const ring = Number.parseFloat(getComputedStyle(next).boxShadow.split(' ').at(-1)) || 0;
          result.push({
            initials: text.textContent,
            covered: glyphs.right - (next.getBoundingClientRect().left - ring),
          });
        }
      });
      return result;
    });
    expect(overlaps.length).toBeGreaterThan(5);
    // The text box includes the glyphs' side bearings, so half a pixel of it may sit under the ring.
    overlaps.forEach(({ covered }) => expect(covered).toBeLessThanOrEqual(0.5));
  });

  test('a single person shows the full name as a title when it is cut', async ({ page }) => {
    const name = row(page, 'crm', 6).locator('[data-col-key="owner"] .lf-table-person-name');
    await expect(name).toHaveAttribute('title', 'Samuel Adeyemi');
  });

  test('row separators run the full width of a table wider than its columns', async ({ page }) => {
    const rows = await table(page, 'narrow').evaluate((root) => {
      const scroller = root.querySelector('.lf-table-scroller');
      const lastCell = root.querySelector('.lf-table-body [data-row-key] [data-col-key="actions"]');
      return {
        viewport: scroller.clientWidth,
        columnsEnd: lastCell.getBoundingClientRect().right - scroller.getBoundingClientRect().left,
        rows: Array.from(
          root.querySelectorAll('.lf-table-header .lf-table-row, .lf-table-body [data-row-key]')
        ).map((element) => ({
          width: element.getBoundingClientRect().width,
          border: getComputedStyle(element).borderBottomWidth,
          cellBorder: getComputedStyle(element.querySelector('.lf-table-gridcell'))
            .borderBottomWidth,
        })),
      };
    });
    expect(rows.columnsEnd).toBeLessThan(rows.viewport / 2);
    rows.rows.forEach((element) => {
      expect(Math.abs(element.width - rows.viewport)).toBeLessThan(1);
      expect(element.border).toBe('1px');
      expect(element.cellBorder).toBe('0px');
    });
  });

  test('column manager labels untitled columns and never cuts an entry above its footer', async ({
    page,
  }) => {
    await table(page, 'crm').locator('[data-lf-toolbar-button="columns"]').click();
    const manager = page.locator('[data-lf-column-manager]');
    await expect(manager).toBeVisible();
    await expect(manager.locator('[data-lf-manager-item][data-col-key="actions"]')).toHaveText(
      'Actions'
    );
    const list = await manager.locator('.lf-table-manager-list').evaluate((element) => ({
      scrollable: element.dataset.scrollable !== undefined,
      scrolls: element.scrollHeight > element.clientHeight,
      cut: Array.from(element.children).filter((entry) => {
        const top = entry.offsetTop - element.scrollTop;
        const bottom = top + entry.offsetHeight;
        return top < element.clientHeight && bottom > element.clientHeight + 0.5;
      }).length,
    }));
    expect(list.scrolls).toBe(true);
    expect(list.scrollable).toBe(true);
    expect(list.cut).toBe(0);
  });

  test('pinned regions cast a shadow only while columns are scrolled under them', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 720 });
    const scroller = table(page, 'crm').locator('.lf-table-scroller');
    const startEdge = row(page, 'crm', 1).locator('[data-col-key="name"]');
    const endEdge = row(page, 'crm', 1).locator('[data-col-key="actions"]');
    const shadows = (locator) =>
      locator.evaluate(
        (element) => getComputedStyle(element).boxShadow.split(/,(?![^(]*\))/).length
      );
    await expect(scroller).not.toHaveAttribute('data-scrolled-start');
    await expect(scroller).toHaveAttribute('data-scrolled-end');
    expect(await shadows(startEdge)).toBe(1);
    expect(await shadows(endEdge)).toBe(2);

    await scroller.evaluate((element) => (element.scrollLeft = 100));
    await expect(scroller).toHaveAttribute('data-scrolled-start');
    await expect(scroller).toHaveAttribute('data-scrolled-end');
    expect(await shadows(startEdge)).toBe(2);

    await scroller.evaluate((element) => (element.scrollLeft = element.scrollWidth));
    await expect(scroller).not.toHaveAttribute('data-scrolled-end');
    expect(await shadows(endEdge)).toBe(1);

    // Pinned cells are opaque, so the columns scrolled under them never show through.
    const header = table(page, 'crm').locator('[data-lf-header][data-col-key="name"]');
    const alpha = await header.evaluate((element) => {
      const canvas = document.createElement('canvas').getContext('2d');
      canvas.fillStyle = getComputedStyle(element).backgroundColor;
      canvas.fillRect(0, 0, 1, 1);
      return canvas.getImageData(0, 0, 1, 1).data[3];
    });
    expect(alpha).toBe(255);
  });

  test('sticky group headers stack one per level', async ({ page }) => {
    const block = table(page, 'grouped');
    const scroller = block.locator('.lf-table-scroller');
    const stickyRows = block.locator('[data-lf-group-sticky] [data-group-key]');
    const rowHeight = await row(page, 'grouped', 1).evaluate((element) => element.offsetHeight);
    const scrollTo = (top) =>
      scroller.evaluate((element, value) => (element.scrollTop = value), top);
    // List: EMEA (0), Ada (1), rows 2-11, Ken (12), rows 13-22, Grace (23), rows 24-33, APAC (34).
    await scrollTo(5 * rowHeight);
    await expect(stickyRows).toHaveCount(2);
    await expect(stickyRows.nth(0)).toHaveAttribute('data-group-key', '["EMEA"]');
    await expect(stickyRows.nth(1)).toHaveAttribute('data-group-key', '["EMEA","Ada"]');
    const header = await block.locator('.lf-table-header').boundingBox();
    const outer = await stickyRows.nth(0).boundingBox();
    const inner = await stickyRows.nth(1).boundingBox();
    expect(Math.abs(outer.y - (header.y + header.height))).toBeLessThan(1);
    expect(Math.abs(inner.y - (outer.y + outer.height))).toBeLessThan(1);

    await scrollTo(15 * rowHeight);
    await expect(stickyRows.nth(1)).toHaveAttribute('data-group-key', '["EMEA","Ken"]');

    // APAC arrives: it pushes the rep header out first, then the region header.
    await scrollTo(34 * rowHeight - rowHeight / 2);
    await expect(stickyRows.nth(0)).toHaveAttribute('data-group-key', '["EMEA"]');
    await expect(block.locator('[data-group-level="0"]')).toHaveAttribute(
      'style',
      new RegExp(`translateY\\(-${rowHeight / 2}px\\)`)
    );
    await scrollTo(34 * rowHeight + 5);
    await expect(stickyRows).toHaveCount(2);
    await expect(stickyRows.nth(0)).toHaveAttribute('data-group-key', '["APAC"]');
    await expect(stickyRows.nth(1)).toHaveAttribute('data-group-key', '["APAC","Ada"]');
  });

  test('collapsing an inner group from its sticky header shows its own header under the outer one', async ({
    page,
  }) => {
    const block = table(page, 'grouped');
    const scroller = block.locator('.lf-table-scroller');
    const rowHeight = await row(page, 'grouped', 1).evaluate((element) => element.offsetHeight);
    await scroller.evaluate((element, value) => (element.scrollTop = value), 15 * rowHeight);
    const inner = block.locator('[data-lf-group-sticky] [data-group-key=\'["EMEA","Ken"]\']');
    await inner.click();
    const own = block.locator('.lf-table-body [data-group-key=\'["EMEA","Ken"]\']');
    await expect(own).toHaveAttribute('aria-expanded', 'false');
    const outer = block.locator('[data-lf-group-sticky] [data-group-key=\'["EMEA"]\']');
    await expect(outer).toBeVisible();
    const outerBox = await outer.boundingBox();
    const ownBox = await own.boundingBox();
    expect(Math.abs(ownBox.y - (outerBox.y + outerBox.height))).toBeLessThan(1);
  });

  test('the status editor shows the current value and options with the cell colours', async ({
    page,
  }) => {
    const cell = row(page, 'crm', 3).locator('[data-col-key="stage"]');
    const cellDot = await cell
      .locator('.lf-table-status-dot')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await cell.dblclick();
    const editor = page.locator('[data-lf-editor]');
    const value = editor.locator('.ant-select-content');
    await expect(value).toHaveCSS('opacity', '1');
    await expect(value.locator('.lf-table-status')).toHaveText('Won');
    const options = page.locator('.lf-table-editor-popup .ant-select-item-option');
    await expect(options).toHaveCount(4);
    await expect(options.locator('.lf-table-status-dot')).toHaveCount(4);
    const optionDot = await options
      .filter({ hasText: 'Won' })
      .locator('.lf-table-status-dot')
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(optionDot).toBe(cellDot);
    // Typing searches the option labels.
    await page.keyboard.type('Lo');
    await expect(options).toHaveCount(1);
    await expect(options).toHaveText('Lost');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });

  test('the tags editor shows picked values and options as the cell chips', async ({ page }) => {
    await row(page, 'crm', 3).locator('[data-col-key="labels"]').dblclick();
    const editor = page.locator('[data-lf-editor]');
    await expect(editor.locator('.lf-table-editor-tag .lf-table-tag').first()).toBeVisible();
    const options = page.locator('.lf-table-editor-popup .ant-select-item-option');
    await expect(options.locator('.lf-table-tag')).toHaveCount(4);
  });
});
