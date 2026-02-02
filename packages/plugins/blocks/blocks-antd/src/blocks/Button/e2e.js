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
  return page.locator(`#bl-${blockId} .ant-btn`);
}

async function click(page, blockId) {
  await locator(page, blockId).click();
}

const assertions = {
  isVisible: (page, blockId) => expect(locator(page, blockId)).toBeVisible(),

  hasText: (page, blockId, text) => expect(locator(page, blockId)).toHaveText(text),

  isDisabled: (page, blockId) => expect(locator(page, blockId)).toBeDisabled(),

  isLoading: (page, blockId) => expect(locator(page, blockId)).toHaveClass(/ant-btn-loading/),

  hasType: (page, blockId, type) =>
    expect(locator(page, blockId)).toHaveClass(new RegExp(`ant-btn-${type}`)),
};

export default { locator, click, assertions };
