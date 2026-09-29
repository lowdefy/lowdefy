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
});
