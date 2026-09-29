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
const bodyRows = (page, blockId) => locator(page, blockId).locator('tbody tr[data-row-key]');

export default createBlockHelper({
  locator,
  do: {
    clickRow: (page, blockId, index) => bodyRows(page, blockId).nth(index).click(),
    sortBy: (page, blockId, title) =>
      locator(page, blockId).locator('thead th', { hasText: title }).click(),
  },
  get: {
    rowCount: (page, blockId) => bodyRows(page, blockId).count(),
  },
  expect: {
    rowCount: (page, blockId, count) => expect(bodyRows(page, blockId)).toHaveCount(count),
    cellText: (page, blockId, rowIndex, columnKey, text) =>
      expect(
        bodyRows(page, blockId).nth(rowIndex).locator(`td[data-col-key="${columnKey}"]`)
      ).toHaveText(text),
    headerTitles: (page, blockId, titles) =>
      expect(locator(page, blockId).locator('thead th.ant-table-cell')).toHaveText(titles),
  },
});
