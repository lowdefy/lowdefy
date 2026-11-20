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

import { expect, test } from 'vitest';

import findActionErrors from './findActionErrors.js';

function emit(failure) {
  return { blockId: 'save_button', eventName: 'onClick', success: false, failure };
}

const failure = {
  actionId: 'save',
  actionType: 'Request',
  configKey: null,
  errorName: 'ServiceError',
  forced: false,
};

test('findActionErrors finds an action that failed with a fault', async () => {
  const drafts = await findActionErrors({
    emits: [emit(failure)],
    resolveSource: async () => null,
  });
  expect(drafts).toEqual([
    {
      kind: 'action-error',
      message: 'Request "save" failed in save_button.onClick with ServiceError.',
      configKey: null,
      source: null,
    },
  ]);
});

test("findActionErrors leaves out an action a test's fail gate failed, and an expected outcome", async () => {
  const drafts = await findActionErrors({
    emits: [
      emit({ ...failure, forced: true }),
      emit({ ...failure, errorName: 'UserError' }),
      { blockId: 'save_button', eventName: 'onClick', success: true, failure: null },
    ],
    resolveSource: async () => null,
  });
  expect(drafts).toEqual([]);
});
