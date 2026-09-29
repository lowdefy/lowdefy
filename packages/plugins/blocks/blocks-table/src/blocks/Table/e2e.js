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

import { createBlockHelper, escapeId } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`#${escapeId(blockId)}`);

const header = (page, blockId, key) =>
  locator(page, blockId).locator(`[data-lf-header][data-col-key="${key}"]`);

const row = (page, blockId, rowKey) =>
  locator(page, blockId).locator(`.lf-table-body [data-row-key="${rowKey}"]`);

const cell = (page, blockId, rowKey, colKey) =>
  row(page, blockId, rowKey).locator(`[data-col-key="${colKey}"]`);

export default createBlockHelper({
  locator,
  do: {
    sort: (page, blockId, key, { multi } = {}) =>
      header(page, blockId, key).click({ modifiers: multi ? ['Shift'] : [] }),
    clickRow: (page, blockId, rowKey) => row(page, blockId, rowKey).click(),
    clickCell: (page, blockId, rowKey, colKey) => cell(page, blockId, rowKey, colKey).click(),
    selectRow: (page, blockId, rowKey) =>
      row(page, blockId, rowKey).locator('[data-lf-select-cell] input').click(),
    selectAll: (page, blockId) => locator(page, blockId).locator('[data-lf-select-all]').click(),
  },
  get: {
    header,
    row,
    cell,
    bodyRows: (page, blockId) => locator(page, blockId).locator('.lf-table-body [role="row"]'),
  },
  expect: {
    rowCount: (page, blockId, count) =>
      expect(locator(page, blockId).locator('[role="grid"]')).toHaveAttribute(
        'aria-rowcount',
        String(count + 1)
      ),
    cellText: (page, blockId, rowKey, colKey, text) =>
      expect(cell(page, blockId, rowKey, colKey)).toHaveText(text),
    sorted: (page, blockId, key, direction) =>
      expect(header(page, blockId, key)).toHaveAttribute('aria-sort', direction),
    selected: (page, blockId, rowKey) =>
      expect(row(page, blockId, rowKey)).toHaveAttribute('aria-selected', 'true'),
    notSelected: (page, blockId, rowKey) =>
      expect(row(page, blockId, rowKey)).toHaveAttribute('aria-selected', 'false'),
  },
});
