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
const lowdefy = { pageId };

test('do not make subblocks for child contexts', async () => {
  const rootBlock = {
    blockId: 'root',
    type: 'Context',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'childContext',
            type: 'Context',
            meta: {
              category: 'context',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'TextInput',
                    blockId: 'text',
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                  },
                ],
              },
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
  const { root, childContext, text } = context.RootBlocks.map;
  expect(context.RootBlocks.subBlocks[root.id][0].subBlocks).toEqual({});
  expect(childContext).toBeDefined();
  expect(text).toBe(undefined);
});
