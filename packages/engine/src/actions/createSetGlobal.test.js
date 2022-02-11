/*
  Copyright 2020-2021 Lowdefy, Inc

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

import testContext from '../../test/testContext.js';

test('SetGlobal data to global', async () => {
  const lowdefy = {
    _internal: {
      actions: {
        SetGlobal: ({ methods: { setGlobal }, params }) => {
          return setGlobal(params);
        },
      },
      blockComponents: {
        Button: { meta: { category: 'display' } },
      },
      lowdefyGlobal: { x: 'old', init: 'init' },
    },
  };
  const rootBlock = {
    id: 'block:root:root:0',
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            id: 'block:root:button:0',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
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
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  expect(context._internal.lowdefy._internal.lowdefyGlobal).toEqual({ x: 'old', init: 'init' });
  const button = context._internal.RootBlocks.map['block:root:button:0'];
  await button.triggerEvent({ name: 'onClick' });
  expect(context._internal.lowdefy._internal.lowdefyGlobal).toEqual({
    init: 'init',
    str: 'hello',
    number: 13,
    arr: [1, 2, 3],
    x: 'new',
  });
});

test.todo('SetGlobal calls context update');
