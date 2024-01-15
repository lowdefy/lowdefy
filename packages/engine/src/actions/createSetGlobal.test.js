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

import { jest } from '@jest/globals';

import testContext from '../../test/testContext.js';

const getLowdefy = (lowdefyGlobal) => {
  return {
    _internal: {
      actions: {
        SetGlobal: ({ methods: { setGlobal }, params }) => {
          return setGlobal(params);
        },
      },
    },
    lowdefyGlobal,
  };
};

test('SetGlobal data to global', async () => {
  const lowdefy = getLowdefy({ x: 'old', init: 'init' });
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'a',
              type: 'SetGlobal',
              params: { str: 'hello', number: 13, arr: [1, 2, 3], x: 'new' },
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context._internal.lowdefy.lowdefyGlobal).toEqual({ x: 'old', init: 'init' });
  const button = context._internal.RootBlocks.map['button'];
  await button.triggerEvent({ name: 'onClick' });
  expect(context._internal.lowdefy.lowdefyGlobal).toEqual({
    init: 'init',
    str: 'hello',
    number: 13,
    arr: [1, 2, 3],
    x: 'new',
  });
});

test('SetGlobal calls context update', async () => {
  const lowdefy = getLowdefy({ x: 'old', init: 'init' });
  const updateFunction = jest.fn();
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'a',
              type: 'SetGlobal',
              params: { str: 'hello', number: 13, arr: [1, 2, 3], x: 'new' },
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  context._internal.update = updateFunction;
  expect(updateFunction).toHaveBeenCalledTimes(0);
  const button = context._internal.RootBlocks.map['button'];
  await button.triggerEvent({ name: 'onClick' });
  expect(updateFunction).toHaveBeenCalledTimes(3); // TODO: Should this not be 1? Investigate.
});

test('SetGlobal changed block properties', async () => {
  const lowdefy = getLowdefy({});
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'old',
          type: 'SetGlobal',
          params: { x: 'old' },
        },
      ],
    },
    blocks: [
      {
        id: 'button',
        type: 'Button',
        properties: {
          a: { _global: 'x' },
        },
        events: {
          onClick: [
            {
              id: 'new',
              type: 'SetGlobal',
              params: { x: 'new' },
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const button = context._internal.RootBlocks.map['button'];
  expect(button.eval.properties).toEqual({ a: 'old' });
  await button.triggerEvent({ name: 'onClick' });
  expect(button.eval.properties).toEqual({ a: 'new' });
});
