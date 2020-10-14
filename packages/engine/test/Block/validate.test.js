import testContext from '../testContext';

const pageId = 'one';
const client = { writeFragment: jest.fn() };

const rootContext = {
  client,
};

test('parse validate on fields', () => {
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
            validate: [
              {
                pass: { _regex: { pattern: 'a', key: 'text' } },
                message: "Not 'a'",
              },
              {
                pass: { _regex: { pattern: 'c', key: 'text' } },
                message: "Not 'c'",
              },
            ],
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: { text: 'a' },
  });
  const { text } = context.RootBlocks.map;

  expect(context.state).toEqual({ text: 'a' });
  expect(text.validateEval.output).toEqual([]);

  context.showValidationErrors = true;
  context.update();
  expect(text.validateEval.output).toEqual([{ message: "Not 'c'", pass: false }]);

  text.setValue('c');
  expect(text.validateEval.output).toEqual([{ message: "Not 'a'", pass: false }]);

  text.setValue('b');
  expect(text.validateEval.output).toEqual([
    { message: "Not 'a'", pass: false },
    { message: "Not 'c'", pass: false },
  ]);
});

test('validate should fail if parser has errors', () => {
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
            validate: [
              {
                pass: { _state: null },
                message: 'Parser failed',
              },
            ],
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
  const { text } = context.RootBlocks.map;

  context.showValidationErrors = true;
  context.update();
  expect(text.validateEval.output).toEqual([{ message: 'Parser failed', pass: false }]);
  expect(text.validateEval.errors.length > 0).toBe(true);
});

test('validate, only test where parser failed should fail', () => {
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
            validate: [
              {
                pass: { _state: null },
                message: 'Parser failed',
              },
              {
                pass: true,
                message: 'Pass',
              },
            ],
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
  const { text } = context.RootBlocks.map;

  context.showValidationErrors = true;
  context.update();
  expect(text.validateEval.output).toEqual([{ message: 'Parser failed', pass: false }]);
});

test('parse validate, validate an object not an array', () => {
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
            validate: {
              pass: { _regex: { pattern: 'c', key: 'text' } },
              message: "Not 'c'",
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
    initState: { text: 'a' },
  });
  const { text } = context.RootBlocks.map;
  expect(context.state).toEqual({ text: 'a' });
  expect(text.validateEval.output).toEqual([]);

  context.showValidationErrors = true;
  context.update();
  expect(text.validateEval.output).toEqual([{ message: "Not 'c'", pass: false }]);
  text.setValue('c');
  expect(text.validateEval.output).toEqual([]);
});

test('RootBlock.validate() to ignore errors where field not visible', () => {
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
          {
            type: 'List',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            visible: { _regex: { pattern: '1', key: 'text' } },
            validate: [
              {
                pass: { _regex: { pattern: '123', key: 'text' } },
                message: 'Error 123',
                status: 'error',
              },
            ],
            areas: {
              content: {
                blocks: [
                  {
                    type: 'TextInput',
                    blockId: 'list.$.innerText',
                    meta: {
                      category: 'input',
                      valueType: 'string',
                    },
                    visible: { _regex: { pattern: '12', key: 'text' } },
                    validate: [
                      {
                        pass: { _regex: { pattern: '1234', key: 'text' } },
                        message: 'Error 1234',
                        status: 'error',
                      },
                    ],
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
  const { text, list } = context.RootBlocks.map;
  expect(context.RootBlocks.validate()).toEqual([]);

  text.setValue('1');
  expect(context.RootBlocks.validate()).toEqual([]);

  context.showValidationErrors = true;
  context.RootBlocks.update();
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list', validate: [{ message: 'Error 123', pass: false, status: 'error' }] },
  ]);

  text.setValue('12');
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list', validate: [{ message: 'Error 123', pass: false, status: 'error' }] },
  ]);

  text.setValue('123');
  expect(context.RootBlocks.validate()).toEqual([]);

  text.setValue('12');
  list.pushItem();
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list', validate: [{ message: 'Error 123', pass: false, status: 'error' }] },
    {
      blockId: 'list.0.innerText',
      validate: [{ message: 'Error 1234', pass: false, status: 'error' }],
    },
  ]);

  text.setValue('123');
  list.pushItem();
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'list.0.innerText',
      validate: [{ message: 'Error 1234', pass: false, status: 'error' }],
    },
    {
      blockId: 'list.1.innerText',
      validate: [{ message: 'Error 1234', pass: false, status: 'error' }],
    },
  ]);

  text.setValue('1234');
  expect(context.RootBlocks.validate()).toEqual([]);

  text.setValue('0');
  expect(context.RootBlocks.validate()).toEqual([]);

  text.setValue('12');
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list', validate: [{ message: 'Error 123', pass: false, status: 'error' }] },
    {
      blockId: 'list.0.innerText',
      validate: [{ message: 'Error 1234', pass: false, status: 'error' }],
    },
    {
      blockId: 'list.1.innerText',
      validate: [{ message: 'Error 1234', pass: false, status: 'error' }],
    },
  ]);
});

test('required on input to return validation error on RootBlock.validate()', () => {
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
            required: true,
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
    rootContext,
    rootBlock,
    pageId,
  });
  const { text } = context.RootBlocks.map;
  expect(context.state).toEqual({
    text: null,
  });
  expect(context.RootBlocks.validate()).toEqual([]);
  context.showValidationErrors = true;
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'text',
      validate: [
        {
          message: 'This field is required',
          pass: false,
          status: 'error',
        },
      ],
    },
  ]);
  text.setValue('a');
  expect(context.RootBlocks.validate()).toEqual([]);
  text.setValue('');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'text',
      validate: [
        {
          message: 'This field is required',
          pass: false,
          status: 'error',
        },
      ],
    },
  ]);
});

test('required on input to return validation error with priority over validation errors on RootBlock.validate()', () => {
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
            required: true,
            validate: [
              {
                pass: { _regex: { pattern: '1234', key: 'text' } },
                message: 'Error 1234',
                status: 'error',
              },
            ],
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
    rootContext,
    rootBlock,
    pageId,
  });
  const { text } = context.RootBlocks.map;
  expect(context.state).toEqual({
    text: null,
  });
  expect(context.RootBlocks.validate()).toEqual([]);
  context.showValidationErrors = true;
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'text',
      validate: [
        {
          message: 'This field is required',
          pass: false,
          status: 'error',
        },
        {
          message: 'Error 1234',
          pass: false,
          status: 'error',
        },
      ],
    },
  ]);
  text.setValue('a');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'text',
      validate: [
        {
          message: 'Error 1234',
          pass: false,
          status: 'error',
        },
      ],
    },
  ]);
  text.setValue('1234');
  expect(context.RootBlocks.validate()).toEqual([]);
  text.setValue('');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'text',
      validate: [
        {
          message: 'This field is required',
          pass: false,
          status: 'error',
        },
        {
          message: 'Error 1234',
          pass: false,
          status: 'error',
        },
      ],
    },
  ]);
});

test('nested arrays with validate, and RootBlock.validate() returns all validation errors', () => {
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
          {
            type: 'array_input',
            blockId: 'list',
            meta: {
              category: 'list',
              valueType: 'array',
            },
            areas: {
              content: {
                blocks: [
                  {
                    type: 'Switch',
                    blockId: 'list.$.swtch',
                    defaultValue: true,
                    meta: {
                      category: 'input',
                      valueType: 'boolean',
                    },
                    validate: [
                      {
                        pass: { _regex: { pattern: '12', key: 'text' } },
                        message: 'Error 12',
                        status: 'error',
                      },
                    ],
                  },
                  {
                    type: 'Box',
                    blockId: 'container',
                    meta: {
                      category: 'container',
                    },
                    areas: {
                      content: {
                        blocks: [
                          {
                            type: 'List',
                            blockId: 'list.$.innerList',
                            meta: {
                              category: 'list',
                              valueType: 'array',
                            },
                            areas: {
                              content: {
                                blocks: [
                                  {
                                    type: 'NumberInput',
                                    blockId: 'list.$.innerList.$.number',
                                    meta: {
                                      category: 'input',
                                      valueType: 'number',
                                    },
                                    validate: [
                                      {
                                        pass: { _regex: { pattern: '1', key: 'text' } },
                                        message: 'Error 1',
                                        status: 'error',
                                      },
                                    ],
                                  },
                                ],
                              },
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
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
    initState: {
      list: [null, null, { innerList: [{ number: 1 }] }, { innerList: [{ number: 2 }] }, null],
    },
  });
  const { text } = context.RootBlocks.map;

  expect(context.state).toEqual({
    text: null,
    list: [
      { innerList: [], swtch: true },
      { innerList: [], swtch: true },
      { innerList: [{ number: 1 }], swtch: true },
      { innerList: [{ number: 2 }], swtch: true },
      { innerList: [], swtch: true },
    ],
  });

  text.setValue('a');
  expect(context.state).toEqual({
    text: 'a',
    list: [
      { innerList: [], swtch: true },
      { innerList: [], swtch: true },
      { innerList: [{ number: 1 }], swtch: true },
      { innerList: [{ number: 2 }], swtch: true },
      { innerList: [], swtch: true },
    ],
  });
  expect(context.RootBlocks.validate()).toEqual([]);

  context.showValidationErrors = true;
  context.RootBlocks.update();
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list.0.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    { blockId: 'list.1.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    { blockId: 'list.2.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    {
      blockId: 'list.2.innerList.0.number',
      validate: [{ message: 'Error 1', pass: false, status: 'error' }],
    },
    { blockId: 'list.3.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    {
      blockId: 'list.3.innerList.0.number',
      validate: [{ message: 'Error 1', pass: false, status: 'error' }],
    },
    { blockId: 'list.4.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
  ]);
  text.setValue('1');
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list.0.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    { blockId: 'list.1.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    { blockId: 'list.2.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    { blockId: 'list.3.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    { blockId: 'list.4.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
  ]);
  text.setValue('12');
  expect(context.RootBlocks.validate()).toEqual([]);
  text.setValue('0');
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list.0.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    { blockId: 'list.1.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    { blockId: 'list.2.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    {
      blockId: 'list.2.innerList.0.number',
      validate: [{ message: 'Error 1', pass: false, status: 'error' }],
    },
    { blockId: 'list.3.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
    {
      blockId: 'list.3.innerList.0.number',
      validate: [{ message: 'Error 1', pass: false, status: 'error' }],
    },
    { blockId: 'list.4.swtch', validate: [{ message: 'Error 12', pass: false, status: 'error' }] },
  ]);
});
