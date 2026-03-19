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

import { expect } from '@playwright/test';

import {
  expectValidationError,
  expectValidationWarning,
  expectValidationSuccess,
} from '../core/validation.js';

// Each block's e2e helper defines a `locator` function that targets the block element on the page.
// Two locator patterns exist:
//   - `#${escapeId(blockId)}` — for blocks that render `id={blockId}` on their root DOM element
//     (e.g. AgGrid variants, ProgressBar, Markdown variants, QRScanner).
//   - `#bl-${escapeId(blockId)}` — for blocks whose root element does not carry the blockId;
//     targets the Lowdefy layout wrapper div instead
//     (e.g. Skeleton variants, Spinner, EChart, DocSearch, ColorSelector, GoogleMaps variants).
function createBlockHelper({ locator, do: doMethods, get: getMethods, expect: expectOverrides }) {
  const commonExpect = {
    visible: (page, blockId) => expect(locator(page, blockId)).toBeVisible(),
    hidden: (page, blockId) => expect(locator(page, blockId)).toBeHidden(),
    disabled: (page, blockId) => expect(locator(page, blockId)).toBeDisabled(),
    enabled: (page, blockId) => expect(locator(page, blockId)).toBeEnabled(),
  };

  const validationExpect = {
    validationError: (page, blockId, params) =>
      expectValidationError(page, { blockId, ...(params ?? {}) }),
    validationWarning: (page, blockId, params) =>
      expectValidationWarning(page, { blockId, ...(params ?? {}) }),
    validationSuccess: (page, blockId) => expectValidationSuccess(page, { blockId }),
  };

  return {
    locator,
    do: { ...(doMethods ?? {}) },
    get: { ...(getMethods ?? {}) },
    expect: {
      ...commonExpect,
      ...validationExpect,
      ...(expectOverrides ?? {}),
    },
  };
}

export default createBlockHelper;
