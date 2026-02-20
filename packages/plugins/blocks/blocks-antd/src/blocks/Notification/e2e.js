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

// Notification renders as a global portal notice — not scoped to a blockId.
// The locator targets the notice container directly.
const locator = (page) => page.locator('.ant-notification-notice');

export default createBlockHelper({
  locator,
  expect: {
    shown: (page, _blockId, text) =>
      expect(page.locator('.ant-notification-notice').filter({ hasText: text })).toBeVisible(),
  },
});
