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

const locator = (page, blockId) => page.locator(`#${blockId}`);

export default createBlockHelper({
  locator,
  expect: {
    title: (page, blockId, text) =>
      expect(locator(page, blockId).locator('.ant-result-title')).toHaveText(text),
    subTitle: (page, blockId, text) =>
      expect(locator(page, blockId).locator('.ant-result-subtitle')).toHaveText(text),
    status: (page, blockId, status) =>
      expect(locator(page, blockId)).toHaveClass(new RegExp(`ant-result-${status}`)),
    success: (page, blockId) => expect(locator(page, blockId)).toHaveClass(/ant-result-success/),
    error: (page, blockId) => expect(locator(page, blockId)).toHaveClass(/ant-result-error/),
    info: (page, blockId) => expect(locator(page, blockId)).toHaveClass(/ant-result-info/),
    warning: (page, blockId) => expect(locator(page, blockId)).toHaveClass(/ant-result-warning/),
  },
});
