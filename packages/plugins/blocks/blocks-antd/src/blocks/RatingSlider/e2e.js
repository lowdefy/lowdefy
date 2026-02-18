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

const locator = (page, blockId) => page.locator(`#${blockId}_input`);

export default createBlockHelper({
  locator,
  do: {
    // Sets value via keyboard: Home resets to min, then ArrowRight steps up by 1.
    // Assumes default min=0 and step=1. For custom min/step configure tests accordingly.
    setValue: async (page, blockId, val) => {
      await locator(page, blockId).focus();
      await locator(page, blockId).press('Home');
      for (let i = 0; i < val; i++) await locator(page, blockId).press('ArrowRight');
    },
  },
  expect: {
    value: (page, blockId, val) =>
      expect(locator(page, blockId)).toHaveAttribute('aria-valuenow', String(val)),
  },
});
