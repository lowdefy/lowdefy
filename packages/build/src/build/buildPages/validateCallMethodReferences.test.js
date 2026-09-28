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

import { jest } from '@jest/globals';

import validateCallMethodReferences from './validateCallMethodReferences.js';

function createContext() {
  return { handleWarning: jest.fn() };
}

function callMethodRef(targetBlockId, action = {}) {
  return {
    targetBlockId,
    action: {
      type: 'CallMethod',
      params: { blockId: targetBlockId, method: 'open' },
      '~k': 'key-1',
      ...action,
    },
  };
}

test('validateCallMethodReferences passes when the target block is on the page', () => {
  const context = createContext();
  validateCallMethodReferences({
    blockIds: ['page', 'modal'],
    callMethodActionRefs: [callMethodRef('modal')],
    hasDynamicBlocks: false,
    pageId: 'page',
    context,
  });
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validateCallMethodReferences warns with a prod error when the target block is missing', () => {
  const context = createContext();
  validateCallMethodReferences({
    blockIds: ['page', 'modal'],
    callMethodActionRefs: [callMethodRef('modl')],
    hasDynamicBlocks: false,
    pageId: 'page',
    context,
  });
  expect(context.handleWarning).toHaveBeenCalledTimes(1);
  const warning = context.handleWarning.mock.calls[0][0];
  expect(warning.message).toContain(
    'CallMethod targets block "modl", which is not defined on page "page".'
  );
  expect(warning.configKey).toBe('key-1');
  expect(warning.prodError).toBe(true);
  expect(warning.checkSlug).toBe('callmethod-refs');
});

test('validateCallMethodReferences matches a concrete list row to its configured pattern', () => {
  const context = createContext();
  validateCallMethodReferences({
    blockIds: ['page', 'list', 'list.$.input'],
    callMethodActionRefs: [callMethodRef('list.0.input'), callMethodRef('list.$.input')],
    hasDynamicBlocks: false,
    pageId: 'page',
    context,
  });
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validateCallMethodReferences skips pages with Dynamic blocks', () => {
  const context = createContext();
  validateCallMethodReferences({
    blockIds: ['page'],
    callMethodActionRefs: [callMethodRef('builtAtRuntime')],
    hasDynamicBlocks: true,
    pageId: 'page',
    context,
  });
  expect(context.handleWarning).not.toHaveBeenCalled();
});

test('validateCallMethodReferences skips actions with a skip condition', () => {
  const context = createContext();
  validateCallMethodReferences({
    blockIds: ['page'],
    callMethodActionRefs: [
      callMethodRef('missing', { skip: true }),
      callMethodRef('missing', { skip: { _state: 'skip' } }),
    ],
    hasDynamicBlocks: false,
    pageId: 'page',
    context,
  });
  expect(context.handleWarning).not.toHaveBeenCalled();
});
