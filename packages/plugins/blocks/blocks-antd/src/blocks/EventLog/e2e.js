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

// Rows are addressed by their position in the ordered log, which stays the same while the search
// and level filter hide other rows.
const rowHead = (page, blockId, index) =>
  page.locator(`#${escapeId(`${blockId}_${index}`)} [aria-expanded]`);

export default createBlockHelper({
  locator,
  do: {
    search: (page, blockId, text) => page.locator(`#${escapeId(`${blockId}_search`)}`).fill(text),
    clearSearch: (page, blockId) => page.locator(`#${escapeId(`${blockId}_search`)}`).fill(''),
    filterLevel: (page, blockId, level) =>
      locator(page, blockId).locator(`button[data-level="${level}"]`).click(),
    toggleRow: async (page, blockId, index) => {
      const head = rowHead(page, blockId, index);
      await head.scrollIntoViewIfNeeded();
      await head.click();
    },
  },
  expect: {
    rowCount: (page, blockId, count) =>
      expect(locator(page, blockId).locator('[role="button"][aria-expanded]')).toHaveCount(count),
    expanded: (page, blockId, index) =>
      expect(rowHead(page, blockId, index)).toHaveAttribute('aria-expanded', 'true'),
    collapsed: (page, blockId, index) =>
      expect(rowHead(page, blockId, index)).toHaveAttribute('aria-expanded', 'false'),
    rowText: (page, blockId, index, text) =>
      expect(page.locator(`#${escapeId(`${blockId}_${index}`)}`)).toContainText(text),
    noData: (page, blockId, text = 'No events.') =>
      expect(locator(page, blockId)).toContainText(text),
    noResults: (page, blockId, text = 'No matching events.') =>
      expect(locator(page, blockId)).toContainText(text),
  },
});
