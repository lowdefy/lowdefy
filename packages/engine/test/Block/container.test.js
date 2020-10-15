import testContext from '../testContext';

const pageId = 'one';
const rootContext = {};

test('container and set value from block', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
                    defaultValue: 'b',
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

test('container blocks visibility toggle fields in state', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
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
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(container.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
});

test('container blocks visibility toggle fields in state with nested containers', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
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
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(container1.visibleEval.output).toEqual(true);
  expect(text.visibleEval.output).toEqual(true);
  expect(context.state).toEqual({ text: 'a', swtch1: true, swtch2: true });
});
