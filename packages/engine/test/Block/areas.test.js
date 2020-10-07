import testContext from '../testContext';

const branch = 'master';
const pageId = 'one';
const client = { writeFragment: jest.fn() };

const rootContext = {
  branch,
  client,
};

test('two areas in block', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      key1: {
        blocks: [
          {
            type: 'Switch',
            blockId: 'swtch1',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
      key2: {
        blocks: [
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
  });
  const { swtch1, swtch2 } = context.RootBlocks.map;
  expect(swtch1.value).toBe(false);
  expect(context.state).toEqual({ swtch1: false, swtch2: false });
  swtch1.setValue(true);
  expect(swtch1.value).toBe(true);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  expect(swtch2.value).toBe(false);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(swtch2.value).toBe(true);
  expect(context.state).toEqual({ swtch1: true, swtch2: true });
});

test('parse values across areas', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      key1: {
        blocks: [
          {
            type: 'Switch',
            blockId: 'swtch1',
            field: 'field',
            visible: { _not: { _state: 'hide1' } },
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
      key2: {
        blocks: [
          {
            type: 'Switch',
            blockId: 'swtch2',
            field: 'field',
            visible: { _not: { _state: 'hide2' } },
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
        ],
      },
      key3: {
        blocks: [
          {
            type: 'Switch',
            blockId: 'hide1',
            meta: {
              category: 'input',
              valueType: 'boolean',
            },
          },
          {
            type: 'Switch',
            blockId: 'hide2',
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
  const { swtch1, swtch2, hide1, hide2 } = context.RootBlocks.map;

  expect(swtch1.visibleEval.output).toBe(true);
  expect(swtch2.visibleEval.output).toBe(true);
  expect(context.state).toEqual({ field: false, hide1: false, hide2: false });

  hide1.setValue(true);
  expect(swtch1.visibleEval.output).toBe(false);
  expect(swtch2.visibleEval.output).toBe(true);
  expect(context.state).toEqual({ field: false, hide1: true, hide2: false });

  swtch2.setValue(true);
  hide2.setValue(true);
  expect(swtch1.visibleEval.output).toBe(false);
  expect(swtch2.visibleEval.output).toBe(false);
  expect(context.state).toEqual({ hide1: true, hide2: true });

  hide2.setValue(false);
  expect(swtch1.visibleEval.output).toBe(false);
  expect(swtch2.visibleEval.output).toBe(true);
  expect(context.state).toEqual({ field: true, hide1: true, hide2: false });
});

test('areas inside list', () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'list',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              key1: {
                blocks: [
                  {
                    type: 'Switch',
                    blockId: 'list.$.swtchB',
                    meta: {
                      category: 'input',
                      valueType: 'boolean',
                    },
                  },
                ],
              },
              key2: {
                blocks: [
                  {
                    type: 'Switch',
                    blockId: 'list.$.swtchA',
                    meta: {
                      category: 'input',
                      valueType: 'boolean',
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
  const { list } = context.RootBlocks.map;

  list.pushItem();
  const swtchA0 = context.RootBlocks.map['list.0.swtchA'];
  const swtchB0 = context.RootBlocks.map['list.0.swtchB'];
  expect(swtchA0.value).toBe(false);
  expect(swtchB0.value).toBe(false);

  swtchA0.setValue(true);
  expect(context.state).toEqual({ list: [{ swtchA: true, swtchB: false }] });

  list.pushItem();
  const swtchA1 = context.RootBlocks.map['list.1.swtchA'];
  const swtchB1 = context.RootBlocks.map['list.1.swtchB'];

  expect(swtchA1.value).toBe(false);
  expect(swtchB1.value).toBe(false);
  swtchB1.setValue(true);
  expect(context.state).toEqual({
    list: [
      { swtchA: true, swtchB: false },
      { swtchA: false, swtchB: true },
    ],
  });
});
