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

async function getValidation(page, blockId) {
  return page.evaluate((id) => {
    const lowdefy = window.lowdefy;
    const pageId = lowdefy?.pageId;
    const context = lowdefy?.contexts?.[`page:${pageId}`];
    const block = context?._internal?.RootAreas?.map?.[id];
    return block?.validationEval?.output;
  }, blockId);
}

async function expectValidationStatus(page, { blockId, status, timeout = 5000 }) {
  await expect
    .poll(
      async () => {
        const validation = await getValidation(page, blockId);
        return validation?.status;
      },
      { timeout }
    )
    .toBe(status);
}

async function expectValidationError(page, { blockId, message, timeout = 5000 }) {
  await expect
    .poll(
      async () => {
        const validation = await getValidation(page, blockId);
        if (validation?.status !== 'error') return { status: validation?.status };
        if (message && !validation?.errors?.includes(message)) {
          return { errors: validation?.errors };
        }
        return true;
      },
      { timeout }
    )
    .toBe(true);
}

async function expectValidationWarning(page, { blockId, message, timeout = 5000 }) {
  await expect
    .poll(
      async () => {
        const validation = await getValidation(page, blockId);
        if (validation?.status !== 'warning') return { status: validation?.status };
        if (message && !validation?.warnings?.includes(message)) {
          return { warnings: validation?.warnings };
        }
        return true;
      },
      { timeout }
    )
    .toBe(true);
}

async function expectValidationSuccess(page, { blockId, timeout = 5000 }) {
  await expectValidationStatus(page, { blockId, status: 'success', timeout });
}

export {
  getValidation,
  expectValidationStatus,
  expectValidationError,
  expectValidationWarning,
  expectValidationSuccess,
};
