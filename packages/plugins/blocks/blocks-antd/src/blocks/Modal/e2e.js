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

// Modal renders as a portal. Ant Design 4 does not forward the id prop to the
// portal DOM element, so we target the first visible non-confirm modal.
const locator = (page, _blockId) => page.locator('.ant-modal:visible').first();

export default createBlockHelper({
  locator,
  do: {
    close: (page, _blockId) => locator(page, _blockId).locator('.ant-modal-close').click(),
    ok: (page, _blockId) => locator(page, _blockId).locator('.ant-btn-primary').click(),
    cancel: (page, _blockId) =>
      locator(page, _blockId).locator('.ant-btn:not(.ant-btn-primary)').click(),
  },
  expect: {
    title: (page, _blockId, text) =>
      expect(locator(page, _blockId).locator('.ant-modal-title')).toHaveText(text),
  },
});
