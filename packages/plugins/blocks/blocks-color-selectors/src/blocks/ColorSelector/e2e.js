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

const locator = (page, blockId) => page.locator(`#bl-${escapeId(blockId)} .color-picker-swatch`);

export default createBlockHelper({
  locator,
  do: {
    click: (page, blockId) => locator(page, blockId).click(),
    fill: (page, blockId, value) =>
      page.locator(`#bl-${escapeId(blockId)} .color-picker-input`).fill(value),
  },
  get: {
    input: (page, blockId) => page.locator(`#bl-${escapeId(blockId)} .color-picker-input`),
  },
  expect: {
    color: (page, blockId, rgb) =>
      expect(locator(page, blockId)).toHaveCSS('background-color', rgb),
    size: (page, blockId, size) =>
      expect(locator(page, blockId)).toHaveClass(new RegExp(`color-picker-swatch-${size}`)),
    value: (page, blockId, hex) =>
      expect(page.locator(`#bl-${escapeId(blockId)} .color-picker-input`)).toHaveValue(hex),
    popoverVisible: (page, blockId) =>
      expect(page.locator(`#bl-${escapeId(blockId)} .color-picker-popover`)).toBeVisible(),
    popoverHidden: (page, blockId) =>
      expect(page.locator(`#bl-${escapeId(blockId)} .color-picker-popover`)).not.toBeVisible(),
  },
});
