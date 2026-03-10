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

// Tour renders as a portal overlay, not inside the block wrapper.
const locator = (page, _blockId) => page.locator('.ant-tour');

export default createBlockHelper({
  locator,
  do: {
    next: (page, _blockId) => page.locator('.ant-tour .ant-tour-footer .ant-tour-next-btn').click(),
    prev: (page, _blockId) => page.locator('.ant-tour .ant-tour-footer .ant-tour-prev-btn').click(),
    close: (page, _blockId) => page.locator('.ant-tour .ant-tour-close').click(),
  },
  expect: {
    visible: (page, _blockId) => expect(page.locator('.ant-tour')).toBeVisible(),
    hidden: (page, _blockId) => expect(page.locator('.ant-tour')).toBeHidden(),
    stepTitle: (page, _blockId, text) =>
      expect(page.locator('.ant-tour .ant-tour-title')).toHaveText(text),
  },
});
