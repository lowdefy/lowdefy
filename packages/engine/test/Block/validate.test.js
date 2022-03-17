/*
  Copyright 2020-2022 Lowdefy, Inc

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
const match = () => true;
const lowdefy = { pageId };

// Comment out to use console
console.log = () => {};
console.error = () => {};

test('parse validate on fields', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text: 'a' },
  });
  const { text } = context.RootBlocks.map;

  expect(context.state).toEqual({ text: 'a' });
  expect(text.eval.validation).toEqual({ errors: ["Not 'c'"], status: null, warnings: [] });

  context.RootBlocks.validate(match);
  expect(text.eval.validation).toEqual({
    errors: ["Not 'c'"],
    status: 'error',
    warnings: [],
  });

  text.setValue('c');
  expect(text.eval.validation).toEqual({
    errors: ["Not 'a'"],
    status: 'error',
    warnings: [],
  });

  text.setValue('b');
  expect(text.eval.validation).toEqual({
    errors: ["Not 'a'", "Not 'c'"],
    status: 'error',
    warnings: [],
  });
});

test('validate should fail if parser has errors', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const { text } = context.RootBlocks.map;

  context.RootBlocks.validate(match);
  expect(text.eval.validation).toEqual({
    errors: ['Parser failed'],
    status: 'error',
    warnings: [],
  });
  expect(text.validationEval.errors.length > 0).toBe(true);
});

test('validate, only test where parser failed should fail', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const { text } = context.RootBlocks.map;

  context.RootBlocks.validate(match);
  expect(text.eval.validation).toEqual({
    errors: ['Parser failed'],
    status: 'error',
    warnings: [],
  });
});

test('parse validate, validate an object not an array', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text: 'a' },
  });
  const { text } = context.RootBlocks.map;
  expect(context.state).toEqual({ text: 'a' });
  expect(text.eval.validation).toEqual({ errors: ["Not 'c'"], status: null, warnings: [] });

  context.RootBlocks.validate(match);
  expect(text.eval.validation).toEqual({
    errors: ["Not 'c'"],
    status: 'error',
    warnings: [],
  });
  text.setValue('c');
  expect(text.eval.validation).toEqual({ errors: [], status: 'success', warnings: [] });
});

test('RootBlock.validate(match) to ignore errors where field not visible', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const { text, list } = context.RootBlocks.map;
  expect(context.RootBlocks.validate(match)).toEqual([]);

  text.setValue('1');
  expect(context.RootBlocks.validate(match)).toEqual([
    {
      blockId: 'list',
      validation: { errors: ['Error 123'], status: 'error', warnings: [] },
    },
  ]);

  text.setValue('12');
  expect(context.RootBlocks.validate(match)).toEqual([
    {
      blockId: 'list',
      validation: { errors: ['Error 123'], status: 'error', warnings: [] },
    },
  ]);

  text.setValue('123');
  expect(context.RootBlocks.validate(match)).toEqual([]);

  text.setValue('12');
  list.pushItem();
  expect(context.RootBlocks.validate(match)).toEqual([
    { blockId: 'list', validation: { errors: ['Error 123'], status: 'error', warnings: [] } },
    {
      blockId: 'list.0.innerText',
      validation: { errors: ['Error 1234'], status: 'error', warnings: [] },
    },
  ]);

  text.setValue('123');
  list.pushItem();
  expect(context.RootBlocks.validate(match)).toEqual([
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
  expect(context.RootBlocks.validate(match)).toEqual([]);

  text.setValue('0');
  expect(context.RootBlocks.validate(match)).toEqual([]);

  text.setValue('12');
  expect(context.RootBlocks.validate(match)).toEqual([
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

test('required on input to return validation error on RootBlock.validate(match)', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const { text } = context.RootBlocks.map;
  expect(context.state).toEqual({
    text: null,
  });
  expect(context.RootBlocks.validate(match)).toEqual([
    {
      blockId: 'text',
      validation: { errors: ['This field is required'], status: 'error', warnings: [] },
    },
  ]);
  text.setValue('a');
  expect(context.RootBlocks.validate(match)).toEqual([]);
  text.setValue('');
  expect(context.RootBlocks.validate(match)).toEqual([
    {
      blockId: 'text',
      validation: { errors: ['This field is required'], status: 'error', warnings: [] },
    },
  ]);
});

test('required on input to return validation error with priority over validation errors on RootBlock.validate(match)', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const { text } = context.RootBlocks.map;
  expect(context.state).toEqual({
    text: null,
  });
  expect(context.RootBlocks.validate(match)).toEqual([
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
  expect(context.RootBlocks.validate(match)).toEqual([
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
  expect(context.RootBlocks.validate(match)).toEqual([]);
  text.setValue('');
  expect(context.RootBlocks.validate(match)).toEqual([
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

test('nested arrays with validate, and RootBlock.validate(match) returns all validation errors', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
  const context = await testContext({
    lowdefy,
    rootBlock,
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
  expect(context.RootBlocks.validate(match)).toEqual([
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
  expect(context.RootBlocks.validate(match)).toEqual([
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
  expect(context.RootBlocks.validate(match)).toEqual([]);
  text.setValue('0');
  expect(context.RootBlocks.validate(match)).toEqual([
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

test('validation warnings', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
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
                status: 'warning',
                message: "Not 'a'",
              },
              {
                pass: { _regex: { pattern: 'c', key: 'text' } },
                status: 'warning',
                message: "Not 'c'",
              },
            ],
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text: 'a' },
  });
  const { text } = context.RootBlocks.map;

  expect(context.state).toEqual({ text: 'a' });
  expect(text.eval.validation).toEqual({
    errors: [],
    status: null,
    warnings: ["Not 'c'"],
  });

  context.RootBlocks.validate(match);
  expect(text.eval.validation).toEqual({
    errors: [],
    status: 'warning',
    warnings: ["Not 'c'"],
  });

  text.setValue('c');
  expect(text.eval.validation).toEqual({
    errors: [],
    status: 'warning',
    warnings: ["Not 'a'"],
  });

  text.setValue('b');
  expect(text.eval.validation).toEqual({
    errors: [],
    status: 'warning',
    warnings: ["Not 'a'", "Not 'c'"],
  });
});

test('showValidation only on fields that matches for error', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'text1',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '1', key: 'text1' } },
                message: "Not '1'",
              },
            ],
          },
          {
            type: 'TextInput',
            blockId: 'text2',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '2', key: 'text2' } },
                message: "Not '2'",
              },
            ],
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text1: '3' },
  });
  const { text1, text2 } = context.RootBlocks.map;

  expect(context.state).toEqual({ text1: '3', text2: null });
  expect(text1.showValidation).toBe(false);
  expect(text1.eval.validation).toEqual({ errors: ["Not '1'"], status: null, warnings: [] });
  expect(text2.showValidation).toBe(false);
  expect(text2.eval.validation).toEqual({ errors: ["Not '2'"], status: null, warnings: [] });
  context.RootBlocks.validate((id) => id === 'text1');
  expect(text1.showValidation).toBe(true);
  expect(text1.eval.validation).toEqual({
    errors: ["Not '1'"],
    status: 'error',
    warnings: [],
  });
  expect(text2.showValidation).toBe(false);
  expect(text2.eval.validation).toEqual({ errors: ["Not '2'"], status: null, warnings: [] });
});

test('showValidation only on fields that matches for warning', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'text1',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '1', key: 'text1' } },
                status: 'warning',
                message: "Not '1'",
              },
            ],
          },
          {
            type: 'TextInput',
            blockId: 'text2',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '2', key: 'text2' } },
                status: 'warning',
                message: "Not '2'",
              },
            ],
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text1: '3' },
  });
  const { text1, text2 } = context.RootBlocks.map;

  expect(context.state).toEqual({ text1: '3', text2: null });
  expect(text1.showValidation).toBe(false);
  expect(text1.eval.validation).toEqual({ warnings: ["Not '1'"], status: null, errors: [] });
  expect(text2.showValidation).toBe(false);
  expect(text2.eval.validation).toEqual({ warnings: ["Not '2'"], status: null, errors: [] });
  context.RootBlocks.validate((id) => id === 'text1');
  expect(text1.showValidation).toBe(true);
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'warning',
    warnings: ["Not '1'"],
  });
  expect(text2.showValidation).toBe(false);
  expect(text2.eval.validation).toEqual({ warnings: ["Not '2'"], status: null, errors: [] });
});

test('showValidation only on fields that matches for success', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'text1',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '1', key: 'text1' } },
                status: 'error',
                message: "Not '1'",
              },
            ],
          },
          {
            type: 'TextInput',
            blockId: 'text2',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '2', key: 'text2' } },
                status: 'error',
                message: "Not '2'",
              },
            ],
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text1: '1' },
  });
  const { text1, text2 } = context.RootBlocks.map;

  expect(context.state).toEqual({ text1: '1', text2: null });
  expect(text1.showValidation).toBe(false);
  expect(text1.eval.validation).toEqual({ warnings: [], status: null, errors: [] });
  expect(text2.showValidation).toBe(false);
  expect(text2.eval.validation).toEqual({ warnings: [], status: null, errors: ["Not '2'"] });
  context.RootBlocks.validate((id) => id === 'text1');
  expect(text1.showValidation).toBe(true);
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(text2.showValidation).toBe(false);
  expect(text2.eval.validation).toEqual({ warnings: [], status: null, errors: ["Not '2'"] });
});

test('drop showValidation on RootBlocks.reset()', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'text1',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '1', key: 'text1' } },
                status: 'error',
                message: "Not '1'",
              },
            ],
          },
          {
            type: 'TextInput',
            blockId: 'text2',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '2', key: 'text2' } },
                status: 'error',
                message: "Not '2'",
              },
            ],
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text1: '1' },
  });
  const { text1, text2 } = context.RootBlocks.map;

  expect(context.state).toEqual({ text1: '1', text2: null });
  expect(text1.showValidation).toBe(false);
  expect(text2.showValidation).toBe(false);
  context.RootBlocks.validate(match);
  expect(text1.showValidation).toBe(true);
  expect(text2.showValidation).toBe(true);
  context.RootBlocks.reset();
  expect(text1.showValidation).toBe(false);
  expect(text2.showValidation).toBe(false);
});

test('drop showValidation on RootBlocks.resetValidation()', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            type: 'TextInput',
            blockId: 'text1',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '1', key: 'text1' } },
                status: 'error',
                message: "Not '1'",
              },
            ],
          },
          {
            type: 'TextInput',
            blockId: 'text2',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            validate: [
              {
                pass: { _regex: { pattern: '2', key: 'text2' } },
                status: 'error',
                message: "Not '2'",
              },
            ],
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    initState: { text1: '1' },
  });
  const { text1, text2 } = context.RootBlocks.map;

  expect(context.state).toEqual({ text1: '1', text2: null });
  expect(text1.showValidation).toBe(false);
  expect(text2.showValidation).toBe(false);
  context.RootBlocks.validate((blockId) => blockId === 'text1');
  expect(text1.showValidation).toBe(true);
  expect(text2.showValidation).toBe(false);
  context.RootBlocks.resetValidation(() => false);
  expect(text1.showValidation).toBe(true);
  expect(text2.showValidation).toBe(false);
  context.RootBlocks.resetValidation((blockId) => blockId === 'text1');
  expect(text1.showValidation).toBe(false);
  expect(text2.showValidation).toBe(false);
});
