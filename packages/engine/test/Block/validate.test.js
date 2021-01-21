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
const rootContext = {};

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
  expect(text.validationEval.output).toEqual({ errors: ["Not 'c'"], status: null, warnings: [] });

  context.showValidationErrors = true;
  context.update();
  expect(text.validationEval.output).toEqual({
    errors: ["Not 'c'"],
    status: 'error',
    warnings: [],
  });

  text.setValue('c');
  expect(text.validationEval.output).toEqual({
    errors: ["Not 'a'"],
    status: 'error',
    warnings: [],
  });

  text.setValue('b');
  expect(text.validationEval.output).toEqual({
    errors: ["Not 'a'", "Not 'c'"],
    status: 'error',
    warnings: [],
  });
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
  expect(text.validationEval.output).toEqual({
    errors: ['Parser failed'],
    status: 'error',
    warnings: [],
  });
  expect(text.validationEval.errors.length > 0).toBe(true);
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
  expect(text.validationEval.output).toEqual({
    errors: ['Parser failed'],
    status: 'error',
    warnings: [],
  });
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
            validate: [
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
  expect(text.validationEval.output).toEqual({ errors: ["Not 'c'"], status: null, warnings: [] });

  context.showValidationErrors = true;
  context.update();
  expect(text.validationEval.output).toEqual({
    errors: ["Not 'c'"],
    status: 'error',
    warnings: [],
  });
  text.setValue('c');
  expect(text.validationEval.output).toEqual({ errors: [], status: 'success', warnings: [] });
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
    {
      blockId: 'list',
      validation: { errors: ['Error 123'], status: 'error', warnings: [] },
    },
  ]);

  text.setValue('12');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'list',
      validation: { errors: ['Error 123'], status: 'error', warnings: [] },
    },
  ]);

  text.setValue('123');
  expect(context.RootBlocks.validate()).toEqual([]);

  text.setValue('12');
  list.pushItem();
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list', validation: { errors: ['Error 123'], status: 'error', warnings: [] } },
    {
      blockId: 'list.0.innerText',
      validation: { errors: ['Error 1234'], status: 'error', warnings: [] },
    },
  ]);

  text.setValue('123');
  list.pushItem();
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'list.0.innerText',
      validation: { errors: ['Error 1234'], status: 'error', warnings: [] },
    },
    {
      blockId: 'list.1.innerText',
      validation: { errors: ['Error 1234'], status: 'error', warnings: [] },
    },
  ]);

  text.setValue('1234');
  expect(context.RootBlocks.validate()).toEqual([]);

  text.setValue('0');
  expect(context.RootBlocks.validate()).toEqual([]);

  text.setValue('12');
  expect(context.RootBlocks.validate()).toEqual([
    { blockId: 'list', validation: { errors: ['Error 123'], status: 'error', warnings: [] } },
    {
      blockId: 'list.0.innerText',
      validation: { errors: ['Error 1234'], status: 'error', warnings: [] },
    },
    {
      blockId: 'list.1.innerText',
      validation: { errors: ['Error 1234'], status: 'error', warnings: [] },
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
      validation: { errors: ['This field is required'], status: 'error', warnings: [] },
    },
  ]);
  text.setValue('a');
  expect(context.RootBlocks.validate()).toEqual([]);
  text.setValue('');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'text',
      validation: { errors: ['This field is required'], status: 'error', warnings: [] },
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
      validation: {
        errors: ['This field is required', 'Error 1234'],
        status: 'error',
        warnings: [],
      },
    },
  ]);
  text.setValue('a');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'text',
      validation: {
        errors: ['Error 1234'],
        status: 'error',
        warnings: [],
      },
    },
  ]);
  text.setValue('1234');
  expect(context.RootBlocks.validate()).toEqual([]);
  text.setValue('');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'text',
      validation: {
        errors: ['This field is required', 'Error 1234'],
        status: 'error',
        warnings: [],
      },
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
      list: [
        { swtch: true },
        { swtch: false },
        { innerList: [{ number: 1 }] },
        { innerList: [{ number: 2 }] },
        { swtch: true },
      ],
    },
  });
  const { text } = context.RootBlocks.map;

  expect(context.state).toEqual({
    text: null,
    list: [
      { innerList: [], swtch: true },
      { innerList: [], swtch: false },
      { innerList: [{ number: 1 }], swtch: false },
      { innerList: [{ number: 2 }], swtch: false },
      { innerList: [], swtch: true },
    ],
  });

  text.setValue('a');
  expect(context.state).toEqual({
    text: 'a',
    list: [
      { innerList: [], swtch: true },
      { innerList: [], swtch: false },
      { innerList: [{ number: 1 }], swtch: false },
      { innerList: [{ number: 2 }], swtch: false },
      { innerList: [], swtch: true },
    ],
  });
  expect(context.RootBlocks.validate()).toEqual([]);

  context.showValidationErrors = true;
  context.RootBlocks.update();
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'list.0.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.1.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.2.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.2.innerList.0.number',
      validation: {
        errors: ['Error 1'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.3.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.3.innerList.0.number',
      validation: {
        errors: ['Error 1'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.4.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
  ]);
  text.setValue('1');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'list.0.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.1.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.2.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.3.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.4.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
  ]);
  text.setValue('12');
  expect(context.RootBlocks.validate()).toEqual([]);
  text.setValue('0');
  expect(context.RootBlocks.validate()).toEqual([
    {
      blockId: 'list.0.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.1.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.2.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.2.innerList.0.number',
      validation: {
        errors: ['Error 1'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.3.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.3.innerList.0.number',
      validation: {
        errors: ['Error 1'],
        status: 'error',
        warnings: [],
      },
    },
    {
      blockId: 'list.4.swtch',
      validation: {
        errors: ['Error 12'],
        status: 'error',
        warnings: [],
      },
    },
  ]);
});
