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

import { createBlockHelper } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`.ant-select:has(#${blockId}_input)`);
const input = (page, blockId) => page.locator(`#${blockId}_input`);

export default createBlockHelper({
  locator,
  do: {
    fill: (page, blockId, val) => input(page, blockId).fill(val),
    select: async (page, blockId, val) => {
      await input(page, blockId).click();
      await page.locator('.ant-select-item-option-content').filter({ hasText: val }).click();
    },
    clear: async (page, blockId) => {
      await locator(page, blockId).hover();
      await locator(page, blockId).locator('.ant-select-clear').click();
    },
  },
  expect: {
    value: (page, blockId, val) => expect(input(page, blockId)).toHaveValue(val),
    placeholder: (page, blockId, text) =>
      expect(locator(page, blockId).locator('.ant-select-selection-placeholder')).toHaveText(text),
  },
});
