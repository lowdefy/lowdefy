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

// The same TableLight config (parity_properties.yaml) rendered under `type: TableLight` and
// `type: Table`: TableLight is a strict subset of Table, so switching the type must show the same
// cells, headers, summary, rules and tooltips, sort the same way and fire the same events.
const ROW_KEYS = ['a', 'b', 'c'];
const COLUMN_KEYS = [
  'name',
  'amount',
  'rate',
  'score',
  'created',
  'active',
  'stage',
  'labels',
  'state',
  'owner',
  'team',
  'profile',
  'email',
  'site',
  'progress',
  'stars',
  'bio',
  'meta',
  'note',
  'actions',
];

const light = {
  cell: (page, rowKey, key) =>
    getBlock(page, 'parity_light').locator(
      `tbody tr[data-row-key="${rowKey}"] td[data-col-key="${key}"]`
    ),
  row: (page, rowKey) =>
    getBlock(page, 'parity_light').locator(`tbody tr[data-row-key="${rowKey}"]`),
  rowKeys: (page) =>
    getBlock(page, 'parity_light')
      .locator('tbody tr[data-row-key]')
      .evaluateAll((rows) => rows.map((row) => row.dataset.rowKey)),
  headerTexts: (page) =>
    getBlock(page, 'parity_light')
      .locator('thead th')
      .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim()).filter(Boolean)),
  summaryTexts: (page) =>
    getBlock(page, 'parity_light')
      .locator('.lf-table-summary')
      .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim())),
  sort: (page, title) =>
    getBlock(page, 'parity_light').locator('thead th', { hasText: title }).first().click(),
};

// The Table virtualises columns (this config is wider than twice the viewport), so reading every
// cell or header scrolls the grid across and collects what each position renders.
function collectAcross({ page, selector, keyOf }) {
  return getBlock(page, 'parity_table')
    .locator('.lf-table-scroller')
    .evaluate(
      async (scroller, args) => {
        const read = new Function('element', `return (${args.keyOf})(element);`);
        const texts = {};
        const frames = () =>
          new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const step = Math.max(100, scroller.clientWidth / 2);
        for (let left = 0; ; left += step) {
          scroller.scrollLeft = left;
          await frames();
          scroller.querySelectorAll(args.selector).forEach((element) => {
            const key = read(element);
            if (key !== null) texts[key] = element.textContent.trim();
          });
          if (left >= scroller.scrollWidth - scroller.clientWidth) break;
        }
        scroller.scrollLeft = 0;
        await frames();
        return texts;
      },
      { selector, keyOf: keyOf.toString() }
    );
}

function scrollTableToEnd(page) {
  return getBlock(page, 'parity_table')
    .locator('.lf-table-scroller')
    .evaluate(async (scroller) => {
      scroller.scrollLeft = scroller.scrollWidth;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
}

const table = {
  cell: (page, rowKey, key) =>
    getBlock(page, 'parity_table').locator(
      `.lf-table-body [data-row-key="${rowKey}"] [data-col-key="${key}"]`
    ),
  cellTexts: (page) =>
    collectAcross({
      page,
      selector: '.lf-table-body [data-row-key] [data-col-key]',
      keyOf: (element) =>
        `${element.closest('[data-row-key]').dataset.rowKey}:${element.dataset.colKey}`,
    }),
  row: (page, rowKey) =>
    getBlock(page, 'parity_table').locator(`.lf-table-body [data-row-key="${rowKey}"]`),
  rowKeys: (page) =>
    getBlock(page, 'parity_table')
      .locator('.lf-table-body [data-row-key]')
      .evaluateAll((rows) => rows.map((row) => row.dataset.rowKey)),
  headerTexts: async (page) => {
    const texts = await collectAcross({
      page,
      selector: '.lf-table-header [role="columnheader"]',
      keyOf: (element) => {
        if (element.dataset.group) return `group:${element.dataset.group}`;
        if (element.dataset.colKey) return `col:${element.dataset.colKey}`;
        return null;
      },
    });
    return Object.values(texts).filter(Boolean);
  },
  summaryTexts: (page) =>
    getBlock(page, 'parity_table')
      .locator('.lf-table-summary')
      .evaluateAll((cells) => cells.map((cell) => cell.textContent.trim())),
  sort: (page, key) =>
    getBlock(page, 'parity_table').locator(`[data-lf-header][data-col-key="${key}"]`).click(),
};

function eventText(page, blockId) {
  return getBlock(page, blockId).textContent();
}

test.describe('TableLight and Table render the same config the same way', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTestPage(page, 'table-parity');
    await expect(table.row(page, 'a')).toBeVisible();
    await expect(light.row(page, 'a')).toBeVisible();
  });

  test('every cell shows the same text', async ({ page }) => {
    const expected = {};
    for (const rowKey of ROW_KEYS) {
      for (const key of COLUMN_KEYS) {
        expected[`${rowKey}:${key}`] = (await light.cell(page, rowKey, key).textContent()).trim();
      }
    }
    expect(await table.cellTexts(page)).toEqual(expected);
    // Spot checks, so a regression that breaks both blocks the same way still fails.
    expect(expected['a:amount']).toBe('€1,200.50');
    expect(expected['a:stage']).toBe('Won');
    expect(expected['a:bio']).toBe('Engineer in Paarl');
    expect(expected['b:active']).toBe('Idle');
  });

  test('headers, header groups and the summary match', async ({ page }) => {
    expect((await table.headerTexts(page)).sort()).toEqual((await light.headerTexts(page)).sort());
    await expect(getBlock(page, 'parity_table').locator('.lf-table-group-header')).toContainText([
      'Rates',
    ]);
    const summary = await light.summaryTexts(page);
    expect(summary.length).toBe(2);
    expect(await table.summaryTexts(page)).toEqual(summary);
  });

  test('rules, row rules, tooltips and $user conditions match', async ({ page }) => {
    await expect(light.cell(page, 'b', 'score').locator('.lf-table-cell')).toHaveClass(
      /parity-low/
    );
    await expect(table.cell(page, 'b', 'score').locator('.lf-table-cell')).toHaveClass(
      /parity-low/
    );
    await expect(light.row(page, 'a')).toHaveClass(/parity-overdue/);
    await expect(table.row(page, 'a')).toHaveClass(/parity-overdue/);
    await expect(table.row(page, 'b')).not.toHaveClass(/parity-overdue/);
    await scrollTableToEnd(page);
    await expect(light.cell(page, 'a', 'note').locator('.lf-table-cell')).toHaveAttribute(
      'title',
      'Alice: First'
    );
    await expect(table.cell(page, 'a', 'note').locator('.lf-table-cell')).toHaveAttribute(
      'title',
      'Alice: First'
    );
    // Promote is hidden where the row's role is not the user's (`$user: role` = admin).
    await expect(table.cell(page, 'a', 'actions').locator('button')).toHaveText([
      'Edit',
      'Promote',
    ]);
    await expect(table.cell(page, 'b', 'actions').locator('button')).toHaveText(['Edit']);
  });

  test('sorting by a header orders the rows the same way', async ({ page }) => {
    await light.sort(page, 'Name');
    await table.sort(page, 'name');
    await expect.poll(() => table.rowKeys(page)).toEqual(['a', 'b', 'c']);
    expect(await light.rowKeys(page)).toEqual(await table.rowKeys(page));

    await light.sort(page, 'Score');
    await table.sort(page, 'score');
    await expect.poll(() => table.rowKeys(page)).toEqual(['b', 'a', 'c']);
    await expect.poll(() => light.rowKeys(page)).toEqual(['b', 'a', 'c']);

    await light.sort(page, 'Score');
    await table.sort(page, 'score');
    // Descending keeps the empty score last, in both.
    await expect.poll(() => table.rowKeys(page)).toEqual(['a', 'b', 'c']);
    await expect.poll(() => light.rowKeys(page)).toEqual(['a', 'b', 'c']);
  });

  test('row, cell and button events carry the same payloads', async ({ page }) => {
    await light.cell(page, 'b', 'name').click();
    await table.cell(page, 'b', 'name').click();
    await expect(getBlock(page, 'parity_table_events')).toContainText('"rowKey":"b"');
    const lightEvents = await eventText(page, 'parity_light_events');
    expect(lightEvents).toContain('"column":{"key":"name","field":"name"}');
    expect(await eventText(page, 'parity_table_events')).toBe(lightEvents);

    await light.cell(page, 'a', 'actions').getByRole('button', { name: 'Edit' }).click();
    await scrollTableToEnd(page);
    await table.cell(page, 'a', 'actions').getByRole('button', { name: 'Edit' }).click();
    await expect(getBlock(page, 'parity_table_events')).toContainText('"buttonIndex":0');
    const lightButton = await eventText(page, 'parity_light_events');
    expect(lightButton).toContain('"button":{"eventName":"onEdit","title":"Edit"}');
    // The button click is the button's: the row click payloads stay those of row b.
    expect(lightButton).toContain('row={"row":{"_id":"b"');
    expect(await eventText(page, 'parity_table_events')).toBe(lightButton);
  });
});
