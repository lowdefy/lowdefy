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

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = { pageId };

test('container and set value from block', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'Box',
            blockId: 'container1',
            meta: {
              category: 'container',
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
                ],
              },
            },
          },
          {
            type: 'Box',
            blockId: 'container2',
            meta: {
              category: 'container',
            },
            areas: {
              content: {
                blocks: [
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
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { textB: 'b' },
  });
  const { textA, textB } = context.RootBlocks.map;
  expect(textA.value).toBe(null);
  expect(textA.setValue).toBeDefined();
  expect(textB.value).toBe('b');
  expect(textB.setValue).toBeDefined();
  expect(context.state).toEqual({ textA: null, textB: 'b' });
  textA.setValue('Hello');
  expect(textA.value).toBe('Hello');
  expect(context.state).toEqual({ textA: 'Hello', textB: 'b' });
});

test('container blocks visibility toggle fields in state and propagate visibility to children', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'Box',
            blockId: 'container',
            meta: {
              category: 'container',
            },
            visible: { _state: 'swtch2' },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'TextInput',
                    blockId: 'text',
                    visible: { _state: 'swtch1' },
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                  },
                ],
              },
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
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text: 'a', swtch1: true, swtch2: true },
  });
  const { container, text, swtch1, swtch2 } = context.RootBlocks.map;
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  swtch1.setValue(false);
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: false, swtch2: true });
  swtch1.setValue(true);
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
  swtch2.setValue(false);
  expect(container.visibleEval.output).toEqual(false);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
});

test('container blocks visibility toggle fields in state with nested containers and propagate visibility to children', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'Box',
            blockId: 'container1',
            meta: {
              category: 'container',
            },
            visible: { _state: 'swtch2' },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'Box',
                    blockId: 'container2',
                    meta: {
                      category: 'container',
                    },
                    areas: {
                      content: {
                        blocks: [
                          {
                            type: 'TextInput',
                            blockId: 'text',
                            visible: { _state: 'swtch1' },
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
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text: 'a', swtch1: true, swtch2: true },
  });
  const { container1, text, swtch1, swtch2 } = context.RootBlocks.map;
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });

  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  swtch1.setValue(false);
  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: false, swtch2: true });
  swtch1.setValue(true);
  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
  swtch2.setValue(false);
  expect(container1.visibleEval.output).toEqual(false);
  expect(text.visibleEval.output).toEqual(false);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
});

test('visibleParent. If container visible is null, child blocks should still be evaluated', async () => {
  const rootBlock = {
    blockId: 'root',
    type: 'Context',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'container',
            type: 'Box',
            meta: {
              category: 'container',
            },
            visible: {
              _state: 'notThere', // will evaluate to null
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
  expect(context.RootBlocks.map.container.eval.visible).toBe(null);
  expect(context.RootBlocks.map.text.eval.visible).toBe(true);
});
