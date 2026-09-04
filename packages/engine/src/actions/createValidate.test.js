/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { jest } from '@jest/globals';
import { ActionError, UserError } from '@lowdefy/errors';

import testContext from '../../test/testContext.js';

const closeLoader = jest.fn();
const displayMessage = jest.fn();
const lowdefy = {
  _internal: {
    actions: {
      Validate: ({ methods: { validate }, params }) => {
        return validate(params);
      },
    },
    displayMessage,
    translate: (key, values) => {
      if (key === 'engine.validation.summary') {
        return `Your input has ${values.count} validation error${values.count === 1 ? '' : 's'}.`;
      }
      if (key === 'engine.validation.fieldRequired') return 'This field is required';
      return key;
    },
  },
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

// Comment out to use console
console.log = () => {};
console.error = () => {};

beforeEach(() => {
  displayMessage.mockReset();
  closeLoader.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
});

beforeAll(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

test('Validate required field', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'text1',
        type: 'TextInput',
        required: true,
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootSlots.map['button'];
  const text1 = context._internal.RootSlots.map['text1'];
  await button.triggerEvent({ name: 'onClick' });
  expect(text1.eval.validation).toEqual({
    errors: ['This field is required'],
    status: 'error',
    warnings: [],
  });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'validate',
        type: 'Validate',
      },
      error: expect.any(UserError),
      index: 0,
    },
    responses: {
      validate: {
        action: {
          id: 'validate',
          type: 'Validate',
        },
        error: expect.any(UserError),
        index: 0,
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(button.Events.events.onClick.history[0].error.error.message).toContain(
    'Your input has 1 validation error'
  );
  expect(text1.eval.validation).toEqual({
    errors: ['This field is required'],
    status: 'error',
    warnings: [],
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "Your input has 1 validation error.",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
  displayMessage.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
  text1.setValue('text1');
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      validate: {
        type: 'Validate',
        index: 0,
        response: undefined,
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(displayMessage.mock.calls).toEqual([]);
  displayMessage.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
});

test('Validate all fields', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'text1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text1', key: 'text1' } },
            message: 'text1 does not match pattern "text1"',
          },
        ],
      },
      {
        id: 'text2',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text2', key: 'text2' } },
            message: 'text2 does not match pattern "text2"',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootSlots.map['button'];
  const text1 = context._internal.RootSlots.map['text1'];
  const text2 = context._internal.RootSlots.map['text2'];
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: null,
    warnings: [],
  });
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'validate',
        type: 'Validate',
      },
      error: expect.any(UserError),
      index: 0,
    },
    responses: {
      validate: {
        action: {
          id: 'validate',
          type: 'Validate',
        },
        error: expect.any(UserError),
        index: 0,
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(button.Events.events.onClick.history[0].error.error.message).toContain(
    'Your input has 2 validation error'
  );
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: ['text2 does not match pattern "text2"'],
    status: 'error',
    warnings: [],
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "Your input has 2 validation errors.",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
  displayMessage.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
  text1.setValue('text1');
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'validate',
        type: 'Validate',
      },
      error: expect.any(UserError),
      index: 0,
    },
    responses: {
      validate: {
        action: {
          id: 'validate',
          type: 'Validate',
        },
        error: expect.any(UserError),
        index: 0,
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(button.Events.events.onClick.history[0].error.error.message).toContain(
    'Your input has 1 validation error'
  );
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: ['text2 does not match pattern "text2"'],
    status: 'error',
    warnings: [],
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "Your input has 1 validation error.",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
  displayMessage.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
  text2.setValue('text2');
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      validate: {
        type: 'Validate',
        index: 0,
        response: undefined,
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`Array []`);
});

test('Validate only one field', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'text1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text1', key: 'text1' } },
            message: 'text1 does not match pattern "text1"',
          },
        ],
      },
      {
        id: 'text2',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text2', key: 'text2' } },
            message: 'text2 does not match pattern "text2"',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
              params: 'text1',
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootSlots.map['button'];
  const text1 = context._internal.RootSlots.map['text1'];
  const text2 = context._internal.RootSlots.map['text2'];
  await button.triggerEvent({ name: 'onClick' });
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'validate',
        params: 'text1',
        type: 'Validate',
      },
      error: expect.any(UserError),
      index: 0,
    },
    responses: {
      validate: {
        action: {
          id: 'validate',
          params: 'text1',
          type: 'Validate',
        },
        error: expect.any(UserError),
        index: 0,
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(button.Events.events.onClick.history[0].error.error.message).toContain(
    'Your input has 1 validation error'
  );
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: ['text2 does not match pattern "text2"'],
    status: null,
    warnings: [],
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "Your input has 1 validation error.",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
  displayMessage.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
  text1.setValue('text1');
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      validate: {
        type: 'Validate',
        index: 0,
        response: undefined,
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: ['text2 does not match pattern "text2"'],
    status: null,
    warnings: [],
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`Array []`);
});

test('Validate list of fields', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'text1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text1', key: 'text1' } },
            message: 'text1 does not match pattern "text1"',
          },
        ],
      },
      {
        id: 'text2',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text2', key: 'text2' } },
            message: 'text2 does not match pattern "text2"',
          },
        ],
      },
      {
        id: 'text3',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text3', key: 'text3' } },
            message: 'text3 does not match pattern "text3"',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
              params: ['text1', 'text2'],
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootSlots.map['button'];
  const text1 = context._internal.RootSlots.map['text1'];
  const text2 = context._internal.RootSlots.map['text2'];
  const text3 = context._internal.RootSlots.map['text3'];
  text1.setValue('text1');
  await button.triggerEvent({ name: 'onClick' });
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: ['text2 does not match pattern "text2"'],
    status: 'error',
    warnings: [],
  });
  expect(text3.eval.validation).toEqual({
    errors: ['text3 does not match pattern "text3"'],
    status: null,
    warnings: [],
  });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'validate',
        params: ['text1', 'text2'],
        type: 'Validate',
      },
      error: expect.any(UserError),
      index: 0,
    },
    responses: {
      validate: {
        action: {
          id: 'validate',
          params: ['text1', 'text2'],
          type: 'Validate',
        },
        error: expect.any(UserError),
        index: 0,
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(button.Events.events.onClick.history[0].error.error.message).toContain(
    'Your input has 1 validation error'
  );
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "Your input has 1 validation error.",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
  displayMessage.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
  text2.setValue('text2');
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: [],
    status: 'success',
    warnings: [],
  });
  expect(text3.eval.validation).toEqual({
    errors: ['text3 does not match pattern "text3"'],
    status: null,
    warnings: [],
  });
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      validate: {
        type: 'Validate',
        index: 0,
        response: undefined,
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(text3.eval.validation).toEqual({
    errors: ['text3 does not match pattern "text3"'],
    status: null,
    warnings: [],
  });
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`Array []`);
});

test('Invalid Validate params', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
              params: 1,
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const button = context._internal.RootSlots.map['button'];
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'validate',
        params: 1,
        type: 'Validate',
      },
      error: expect.any(ActionError),
      index: 0,
    },
    responses: {
      validate: {
        action: {
          id: 'validate',
          params: 1,
          type: 'Validate',
        },
        error: expect.any(ActionError),
        index: 0,
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(button.Events.events.onClick.history[0].error.error._message).toContain(
    'Invalid validate params.'
  );
  expect(displayMessage.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "content": "Invalid validate params.",
          "duration": 6,
          "status": "error",
        },
      ],
    ]
  `);
});

test('Validate does not fail on warnings', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'text1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text1', key: 'text1' } },
            status: 'warning',
            message: 'text1 does not match pattern "text1"',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootSlots.map['button'];
  const text1 = context._internal.RootSlots.map['text1'];
  await button.triggerEvent({ name: 'onClick' });
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'warning',
    warnings: ['text1 does not match pattern "text1"'],
  });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    event: undefined,
    eventName: 'onClick',
    responses: {
      validate: {
        type: 'Validate',
        index: 0,
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(text1.eval.validation).toEqual({
    errors: [],
    status: 'warning',
    warnings: ['text1 does not match pattern "text1"'],
  });
});

test('Validate on nested objects using params.regex string', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'obj.text1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text1', key: 'text1' } },
            message: 'text1 does not match pattern "text1"',
          },
        ],
      },
      {
        id: 'text2',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text2', key: 'text2' } },
            message: 'text2 does not match pattern "text2"',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
              params: {
                regex: '^obj.*1$',
              },
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootSlots.map['button'];
  const text1 = context._internal.RootSlots.map['obj.text1'];
  await button.triggerEvent({ name: 'onClick' });
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    error: {
      action: { id: 'validate', type: 'Validate', params: { regex: '^obj.*1$' } },
      error: expect.any(UserError),
      index: 0,
    },
    eventName: 'onClick',
    responses: {
      validate: {
        action: { id: 'validate', type: 'Validate', params: { regex: '^obj.*1$' } },
        error: expect.any(UserError),
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
  expect(button.Events.events.onClick.history[0].error.error.message).toContain(
    'Your input has 1 validation error'
  );
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
});

test('Validate on nested objects using params.regex array', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'obj.text1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text1', key: 'text1' } },
            message: 'text1 does not match pattern "text1"',
          },
        ],
      },
      {
        id: 'obj.abc1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'abc1', key: 'abc1' } },
            message: 'abc1 does not match pattern "abc1"',
          },
        ],
      },
      {
        id: 'text2',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text2', key: 'text2' } },
            message: 'text2 does not match pattern "text2"',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
              params: {
                regex: ['^obj.*1$'],
              },
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootSlots.map['button'];
  const text2 = context._internal.RootSlots.map['text2'];
  const text1 = context._internal.RootSlots.map['obj.text1'];
  const abc1 = context._internal.RootSlots.map['obj.abc1'];
  await button.triggerEvent({ name: 'onClick' });
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    error: {
      action: { id: 'validate', type: 'Validate', params: { regex: ['^obj.*1$'] } },
      error: expect.any(UserError),
      index: 0,
    },
    eventName: 'onClick',
    responses: {
      validate: {
        action: { id: 'validate', type: 'Validate', params: { regex: ['^obj.*1$'] } },
        error: expect.any(UserError),
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
  expect(button.Events.events.onClick.history[0].error.error.message).toContain(
    'Your input has 2 validation error'
  );
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
  expect(abc1.eval.validation).toEqual({
    errors: ['abc1 does not match pattern "abc1"'],
    status: 'error',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: ['text2 does not match pattern "text2"'],
    status: null,
    warnings: [],
  });
});

test('Validate on nested objects using params.regex array and blockIds', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'obj.text1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text1', key: 'text1' } },
            message: 'text1 does not match pattern "text1"',
          },
        ],
      },
      {
        id: 'obj.abc1',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'abc1', key: 'abc1' } },
            message: 'abc1 does not match pattern "abc1"',
          },
        ],
      },
      {
        id: 'text2',
        type: 'TextInput',
        validate: [
          {
            pass: { _regex: { pattern: 'text2', key: 'text2' } },
            message: 'text2 does not match pattern "text2"',
          },
        ],
      },
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [
            {
              id: 'validate',
              type: 'Validate',
              params: {
                regex: ['^obj.*t1$'],
                blockIds: ['text2'],
              },
            },
          ],
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootSlots.map['button'];
  const text2 = context._internal.RootSlots.map['text2'];
  const text1 = context._internal.RootSlots.map['obj.text1'];
  const abc1 = context._internal.RootSlots.map['obj.abc1'];
  await button.triggerEvent({ name: 'onClick' });
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    error: {
      action: {
        id: 'validate',
        type: 'Validate',
        params: { regex: ['^obj.*t1$'], blockIds: ['text2'] },
      },
      error: expect.any(UserError),
      index: 0,
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      validate: {
        action: {
          id: 'validate',
          type: 'Validate',
          params: { regex: ['^obj.*t1$'], blockIds: ['text2'] },
        },
        error: expect.any(UserError),
        index: 0,
      },
    },
    endTimestamp: { date: 0 },
    startTimestamp: { date: 0 },
    success: false,
  });
  expect(button.Events.events.onClick.history[0].error.error.message).toContain(
    'Your input has 2 validation error'
  );
  expect(text1.eval.validation).toEqual({
    errors: ['text1 does not match pattern "text1"'],
    status: 'error',
    warnings: [],
  });
  expect(text2.eval.validation).toEqual({
    errors: ['text2 does not match pattern "text2"'],
    status: 'error',
    warnings: [],
  });
  expect(abc1.eval.validation).toEqual({
    errors: ['abc1 does not match pattern "abc1"'],
    status: null,
    warnings: [],
  });
});

async function requiredFieldValidation({ blockType, value, valueType }) {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'text1',
        type: blockType,
        required: true,
      },
    ],
  };
  const context = await testContext({
    lowdefy: {
      ...lowdefy,
      _internal: {
        ...lowdefy._internal,
        blocks: { [blockType]: {} },
        blockMetas: { [blockType]: { category: 'input', valueType } },
      },
    },
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  const text1 = context._internal.RootSlots.map['text1'];
  text1.setValue(value);
  return text1.eval.validation.errors;
}

test('required fails an empty string', async () => {
  expect(
    await requiredFieldValidation({ blockType: 'TextInput', valueType: 'string', value: '' })
  ).toEqual(['This field is required']);
});

test('required fails an empty array', async () => {
  expect(
    await requiredFieldValidation({
      blockType: 'MultipleSelector',
      valueType: 'array',
      value: [],
    })
  ).toEqual(['This field is required']);
});

test('required fails null', async () => {
  expect(
    await requiredFieldValidation({ blockType: 'TextInput', valueType: 'string', value: null })
  ).toEqual(['This field is required']);
});

test('required passes 0', async () => {
  expect(
    await requiredFieldValidation({ blockType: 'NumberInput', valueType: 'number', value: 0 })
  ).toEqual([]);
});

test('required passes false', async () => {
  expect(
    await requiredFieldValidation({ blockType: 'Switch', valueType: 'boolean', value: false })
  ).toEqual([]);
});

test('required passes an empty object', async () => {
  expect(
    await requiredFieldValidation({ blockType: 'ObjectInput', valueType: 'object', value: {} })
  ).toEqual([]);
});

test('required passes a non-empty string', async () => {
  expect(
    await requiredFieldValidation({ blockType: 'TextInput', valueType: 'string', value: 'a' })
  ).toEqual([]);
});

test('required passes a non-empty array', async () => {
  expect(
    await requiredFieldValidation({
      blockType: 'MultipleSelector',
      valueType: 'array',
      value: ['a'],
    })
  ).toEqual([]);
});

test("required inside a List validates each row's own value", async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ textInput: 'a' }, { textInput: '' }, { textInput: 'c' }] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [
          {
            id: 'list.$.textInput',
            type: 'TextInput',
            required: true,
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
    operators: lowdefy._internal.operators,
  });
  expect(context._internal.RootSlots.map['list.0.textInput'].eval.validation.errors).toEqual([]);
  expect(context._internal.RootSlots.map['list.1.textInput'].eval.validation.errors).toEqual([
    'This field is required',
  ]);
  expect(context._internal.RootSlots.map['list.2.textInput'].eval.validation.errors).toEqual([]);
});

const contractPageConfig = ({ validateParams }) => ({
  id: 'root',
  type: 'Box',
  state: {
    'data.address': {
      type: 'object',
      properties: { formatted_address: { type: 'string', minLength: 3 } },
      required: ['formatted_address'],
    },
    'data.status': { enum: ['draft', 'submitted'] },
    count: { type: 'number' },
  },
  blocks: [
    { id: 'data.address.formatted_address', type: 'TextInput' },
    { id: 'count', type: 'NumberInput', required: true },
    {
      id: 'button',
      type: 'Button',
      events: {
        onClick: [{ id: 'validate', type: 'Validate', params: validateParams }],
      },
    },
  ],
});

test('Validate schema: true fails state that violates the contract and attaches the error to the owning block', async () => {
  const pageConfig = contractPageConfig({ validateParams: { schema: true } });
  const context = await testContext({ lowdefy, pageConfig });
  const button = context._internal.RootSlots.map['button'];
  const address = context._internal.RootSlots.map['data.address.formatted_address'];
  address.setValue('ab');
  context._internal.RootSlots.map['count'].setValue(1);
  context._internal.State.set('data.status', 'nope');
  await button.triggerEvent({ name: 'onClick' });
  expect(address.eval.validation).toEqual({
    errors: ['must NOT have fewer than 3 characters'],
    status: 'error',
    warnings: [],
  });
  const { error } = button.Events.events.onClick.history[0];
  expect(error.error).toBeInstanceOf(UserError);
  expect(error.error.message).toEqual(
    'Your input has 2 validation errors.\nstate.data.status: must be equal to one of the allowed values'
  );
  // schema alone does not select blocks for their own validation tests
  expect(context._internal.RootSlots.map['count'].eval.validation.status).toEqual(null);
  // editing the block clears the attached schema error
  address.setValue('abcd');
  expect(address.eval.validation.errors).toEqual([]);
});

test('Validate schema: true passes conforming state', async () => {
  const pageConfig = contractPageConfig({ validateParams: { schema: true } });
  const context = await testContext({ lowdefy, pageConfig });
  const button = context._internal.RootSlots.map['button'];
  context._internal.RootSlots.map['data.address.formatted_address'].setValue('abcd');
  context._internal.RootSlots.map['count'].setValue(1);
  context._internal.State.set('data.status', 'draft');
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0].error).toEqual(undefined);
});

test('Validate schema: "data.address" scopes the check to that fragment', async () => {
  const pageConfig = contractPageConfig({ validateParams: { schema: 'data.address' } });
  const context = await testContext({ lowdefy, pageConfig });
  const button = context._internal.RootSlots.map['button'];
  const address = context._internal.RootSlots.map['data.address.formatted_address'];
  context._internal.State.set('data.status', 'nope');
  address.setValue('abcd');
  await button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0].error).toEqual(undefined);
  address.setValue(null);
  await button.triggerEvent({ name: 'onClick' });
  expect(address.eval.validation.errors).toEqual(['must be string']);
  expect(button.Events.events.onClick.history[0].error.error.message).toEqual(
    'Your input has 1 validation error.'
  );
});

test('Validate schema combined with blockIds runs both checks', async () => {
  const pageConfig = contractPageConfig({
    validateParams: { blockIds: ['count'], schema: 'data.address' },
  });
  const context = await testContext({ lowdefy, pageConfig });
  const button = context._internal.RootSlots.map['button'];
  const address = context._internal.RootSlots.map['data.address.formatted_address'];
  address.setValue('ab');
  await button.triggerEvent({ name: 'onClick' });
  expect(context._internal.RootSlots.map['count'].eval.validation.errors).toEqual([
    'This field is required',
  ]);
  expect(address.eval.validation.errors).toEqual(['must NOT have fewer than 3 characters']);
  expect(button.Events.events.onClick.history[0].error.error.message).toEqual(
    'Your input has 2 validation errors.'
  );
});

// The build (checkValidateActionSchemas) refuses a Validate whose literal
// schema path is not in the contract, so the engine's own message is only
// reachable when the path is computed at runtime.
test('Validate schema reports an operator-computed path that is not in the contract', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    state: { count: { type: 'number' }, pick: { type: 'string' } },
    blocks: [
      {
        id: 'button',
        type: 'Button',
        events: {
          onClick: [{ id: 'validate', type: 'Validate', params: { schema: { _state: 'pick' } } }],
        },
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  context._internal.State.set('pick', 'not_declared');
  const button = context._internal.RootSlots.map['button'];
  await button.triggerEvent({ name: 'onClick' });
  const { error } = button.Events.events.onClick.history[0];
  expect(error.error).toBeInstanceOf(ActionError);
  expect(error.error.message).toMatch(/is not part of the state contract/);
});

// The declared type decides what "empty" means for a required block. Inside a
// List the block's id carries its row index (list.0.count), so the contract's
// `items` has to be walked for the override to apply at all.
test('the declared state type resolves through a List row so a required 0 passes', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    state: {
      list: {
        type: 'array',
        items: { type: 'object', properties: { count: { type: 'number' } } },
      },
    },
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ count: 0 }, { count: null }] },
        },
      ],
    },
    blocks: [
      {
        id: 'list',
        type: 'List',
        blocks: [{ id: 'list.$.count', type: 'NumberInput', required: true }],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  expect(context._internal.RootSlots.map['list.0.count'].getDeclaredStateType()).toBe('number');
  expect(context._internal.RootSlots.map['list.0.count'].eval.validation.errors).toEqual([]);
  expect(context._internal.RootSlots.map['list.1.count'].eval.validation.errors).toEqual([
    'This field is required',
  ]);
});
