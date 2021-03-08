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

import testContext from '../testContext';

const pageId = 'one';

test('SetGlobal data to global', async () => {
  const lowdefy = {
    lowdefyGlobal: { x: 'old', init: 'init' },
    pageId,
  };
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
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
  const context = testContext({
    lowdefy,
    rootBlock,
  });

  expect(context.root.lowdefyGlobal).toEqual({ x: 'old', init: 'init' });
  const { button } = context.RootBlocks.map;

  await button.triggerEvent({ name: 'onClick' });
  expect(context.root.lowdefyGlobal).toEqual({
    init: 'init',
    str: 'hello',
    number: 13,
    arr: [1, 2, 3],
    x: 'new',
  });
});
