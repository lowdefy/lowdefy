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
import { getTrace } from '@lowdefy/engine';

import getBlockMethods from './getBlockMethods.js';

function createBlock(blockId) {
  return {
    blockId,
    methods: {},
    registerEvent: jest.fn(),
    registerMethod: jest.fn(),
    setValue: jest.fn(),
    triggerEvent: jest.fn(async () => ({ success: true })),
  };
}

function createLowdefy() {
  return {
    _internal: { storage: { appKey: jest.fn(), userKey: jest.fn() }, translate: jest.fn() },
  };
}

test('a press and a change reach the engine block and are reported as interactions', async () => {
  const lowdefy = createLowdefy();
  const block = createBlock('name');
  const reported = [];
  getTrace(lowdefy).subscribeInteractions((interaction) => reported.push(interaction));
  const methods = getBlockMethods({ block, category: 'input', lowdefy });
  methods.setValue('Ada');
  await methods.triggerEvent({ name: 'onChange', event: { value: 'Ada' } });
  await methods.triggerEvent({ name: 'onPressEnter' });
  await methods.triggerEvent({ name: 'onClick' });
  expect(block.setValue).toHaveBeenCalledWith('Ada');
  expect(block.triggerEvent.mock.calls.map(([event]) => event.name)).toEqual([
    'onChange',
    'onPressEnter',
    'onClick',
  ]);
  expect(reported.map(({ t, ...interaction }) => interaction)).toEqual([
    { kind: 'change', blockId: 'name', value: 'Ada' },
    { kind: 'key', key: 'Enter', blockId: 'name' },
    { kind: 'click', blockId: 'name' },
  ]);
});

test('a block keeps the same triggerEvent and setValue across renders', () => {
  const lowdefy = createLowdefy();
  const block = createBlock('name');
  const first = getBlockMethods({ block, category: 'input', lowdefy });
  const { setValue, triggerEvent } = first;
  const second = getBlockMethods({ block, category: 'input', lowdefy });
  expect(second.triggerEvent).toBe(triggerEvent);
  expect(second.setValue).toBe(setValue);
});

test('a display block gets no setValue', () => {
  const methods = getBlockMethods({
    block: createBlock('title'),
    category: 'display',
    lowdefy: createLowdefy(),
  });
  expect(methods.setValue).toBeUndefined();
});
