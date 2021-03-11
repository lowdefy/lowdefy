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

test('registerMethod adds a method to RootBlocks.methods', () => {
  const rootBlock = {
    blockId: 'root',
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
  };
  const context = testContext({
    lowdefy,
    rootBlock,
  });
  const { text } = context.RootBlocks.map;

  expect(text.registerMethod).toBeDefined();
  expect(text.methods).toEqual({});
  const method = () => 'fn response';
  text.registerMethod('fn', method);
  expect(text.methods).toEqual({ fn: method });
  expect(text.methods.fn()).toEqual('fn response');
});

test('registerMethod add multiple methods to RootBlocks.methods', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'textA',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'textB',
            meta: {
              category: 'input',
              valueType: 'string',
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
  const { textA, textB } = context.RootBlocks.map;

  const methodA = () => 'fn A response';
  const methodB1 = () => 'fn B1 response';
  const methodB2 = () => 'fn B2 response';
  textA.registerMethod('A', methodA);
  textB.registerMethod('B1', methodB1);
  textB.registerMethod('B2', methodB2);
  expect(textA.methods).toEqual({ A: methodA });
  expect(textB.methods).toEqual({ B1: methodB1, B2: methodB2 });
  expect(textA.methods.A()).toEqual('fn A response');
  expect(textB.methods.B1()).toEqual('fn B1 response');
  expect(textB.methods.B2()).toEqual('fn B2 response');
});
