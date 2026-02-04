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

import {
  expectValidationError,
  expectValidationWarning,
  expectValidationSuccess,
} from '../core/validation.js';

function createBlockHelper({ locator, set, expect: expectOverrides }) {
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
    set: { ...(set ?? {}) },
    expect: {
      ...commonExpect,
      ...validationExpect,
      ...(expectOverrides ?? {}),
    },
  };
}

export default createBlockHelper;
