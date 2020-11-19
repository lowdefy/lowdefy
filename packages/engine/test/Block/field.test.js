/*
   Copyright 2020 Lowdefy, Inc

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
const rootContext = {};

test('set value to block field', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'Switch',
            blockId: 'swtch',
            field: 'field',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { swtch } = context.RootBlocks.map;

  expect(swtch.value).toBe(false);
  expect(context.state).toEqual({ field: false });
  expect(swtch.setValue).toBeDefined();
  swtch.setValue(true);
  expect(swtch.value).toBe(true);
  expect(context.state).toEqual({ field: true });
});

test('array block with init, save to field', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'List',
            blockId: 'list',
            field: 'field',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'TextInput',
                    blockId: 'list.$.text',
                    field: 'field.$.text',
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
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { field: [{ text: 'b' }] },
  });
  expect(context.state).toEqual({ field: [{ text: 'b' }] });
});

test('two blocks with same field should have the same value', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'Switch',
            blockId: 'swtch1',
            field: 'field',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
          {
            type: 'Switch',
            blockId: 'swtch2',
            field: 'field',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { swtch1, swtch2 } = context.RootBlocks.map;
  expect(swtch1.value).toBe(false);
  expect(swtch2.value).toBe(false);
  expect(context.state).toEqual({ field: false });

  swtch1.setValue(true);
  expect(swtch1.value).toBe(true);
  expect(swtch2.value).toBe(true);
  expect(context.state).toEqual({ field: true });

  swtch2.setValue(false);
  expect(swtch1.value).toBe(false);
  expect(swtch2.value).toBe(false);
  expect(context.state).toEqual({ field: false });
});

test('two blocks with same field visibility and state', () => {
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
            blockId: 'text1',
            field: 'field',
            visible: { _state: 'swtch1' },
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'TextInput',
            blockId: 'text2',
            field: 'field',
            visible: { _state: 'swtch2' },
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          {
            type: 'Switch',
            blockId: 'swtch1',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
          {
            type: 'Switch',
            blockId: 'swtch2',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { field: 'field', swtch2: true, swtch1: true },
  });
  const { swtch1, swtch2, text1, text2 } = context.RootBlocks.map;

  expect(text1.visibleEval.output).toBe(true);
  expect(text2.visibleEval.output).toBe(true);
  expect(context.state).toEqual({ field: 'field', swtch1: true, swtch2: true });

  swtch1.setValue(false);
  expect(text1.visibleEval.output).toBe(false);
  expect(text2.visibleEval.output).toBe(true);
  expect(context.state).toEqual({ field: 'field', swtch1: false, swtch2: true });

  text2.setValue('new');
  expect(text1.value).toEqual('new');
  expect(text2.value).toEqual('new');
  expect(context.state).toEqual({ field: 'new', swtch1: false, swtch2: true });

  swtch2.setValue(false);
  expect(text1.visibleEval.output).toBe(false);
  expect(text2.visibleEval.output).toBe(false);
  expect(text1.value).toEqual('new');
  expect(text2.value).toEqual('new');
  expect(context.state).toEqual({ swtch1: false, swtch2: false });

  swtch1.setValue(true);
  expect(text1.visibleEval.output).toBe(true);
  expect(text2.visibleEval.output).toBe(false);
  expect(context.state).toEqual({ field: 'new', swtch1: true, swtch2: false });
});
