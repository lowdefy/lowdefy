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

const locator = (page, blockId) => page.locator(`#bl-${blockId} .ant-collapse`);

export default createBlockHelper({
  locator,
  do: {
    expand: (page, blockId, label) =>
      locator(page, blockId).locator('.ant-collapse-header').filter({ hasText: label }).click(),
    collapse: (page, blockId, label) =>
      locator(page, blockId).locator('.ant-collapse-header').filter({ hasText: label }).click(),
  },
  expect: {
    expanded: (page, blockId, label) =>
      expect(
        locator(page, blockId)
          .locator('.ant-collapse-item-active .ant-collapse-header')
          .filter({ hasText: label })
      ).toBeVisible(),
    panelCount: (page, blockId, count) =>
      expect(locator(page, blockId).locator('.ant-collapse-item')).toHaveCount(count),
  },
});
