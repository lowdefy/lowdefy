/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { expect } from '@playwright/test';

function locator(page, blockId) {
  return page.locator(`.ant-select:has(#${blockId}_input)`);
}

function optionLocator(page, blockId, index) {
  return page.locator(`#${blockId}_${index}`);
}

async function select(page, blockId, value) {
  await locator(page, blockId).click();
  await page.locator(`.ant-select-item-option-content:has-text("${value}")`).click();
}

async function clear(page, blockId) {
  const selector = locator(page, blockId);
  await selector.hover();
  await selector.locator('.ant-select-clear').click();
}

async function search(page, blockId, text) {
  await locator(page, blockId).click();
  await page.keyboard.type(text);
}

const assertions = {
  isVisible: (page, blockId) => expect(locator(page, blockId)).toBeVisible(),

  hasValue: (page, blockId, value) =>
    expect(locator(page, blockId).locator('.ant-select-selection-item')).toHaveText(value),

  isDisabled: (page, blockId) => expect(locator(page, blockId)).toHaveClass(/ant-select-disabled/),

  hasPlaceholder: (page, blockId, text) =>
    expect(locator(page, blockId).locator('.ant-select-selection-placeholder')).toHaveText(text),
};

export default { locator, optionLocator, select, clear, search, assertions };
