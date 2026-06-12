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

export default createBlockHelper({
  locator,
  do: {
    clickItem: async (page, blockId, index) => {
      const card = page.locator(`#${escapeId(`${blockId}_${index}`)}`);
      await card.scrollIntoViewIfNeeded();
      await card.click();
    },
    select: async (page, blockId, index) => {
      const card = page.locator(`#${escapeId(`${blockId}_${index}`)}`);
      await card.scrollIntoViewIfNeeded();
      await card.click();
    },
    scrollToIndex: (page, blockId, index) =>
      page.locator(`#${escapeId(`${blockId}_${index}`)}`).scrollIntoViewIfNeeded(),
    search: (page, blockId, text) =>
      page.locator(`#${escapeId(`${blockId}_search`)} input`).fill(text),
    clearSearch: (page, blockId) =>
      page.locator(`#${escapeId(`${blockId}_search`)} input`).fill(''),
  },
  expect: {
    renderedCount: (page, blockId, count) =>
      expect(locator(page, blockId).locator('.ant-card')).toHaveCount(count),
    noResults: (page, blockId, text = 'No results') =>
      expect(locator(page, blockId)).toContainText(text),
    selected: (page, blockId, index) =>
      expect(page.locator(`#${escapeId(`${blockId}_${index}`)}`)).toHaveAttribute(
        'aria-selected',
        'true'
      ),
  },
});
