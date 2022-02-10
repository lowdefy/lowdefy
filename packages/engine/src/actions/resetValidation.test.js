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

import { get, type } from '@lowdefy/helpers';

// TODO: issue importing plugin packages with jest due to jest es module resolution #https://github.com/facebook/jest/issues/9771
// import { _not, _type } from '@lowdefy/operators-js/operators/client';

import testContext from '../../test/testContext.js';

const closeLoader = jest.fn();
const displayMessage = jest.fn();
const lowdefy = {
  _internal: {
    actions: {
      ResetValidation: ({ methods: { resetValidation }, params }) => {
        return resetValidation(params);
      },
      Validate: ({ methods: { validate }, params }) => {
        return validate(params);
      },
    },
    blockComponents: {
      Button: { meta: { category: 'display' } },
      TextInput: { meta: { category: 'input', valueType: 'string' } },
    },
    displayMessage,
    operators: {
      _not: ({ params }) => {
        return !params;
      },
      _type: ({ location, params, state }) => {
        const typeName = type.isObject(params) ? params.type : params;
        if (!type.isString(typeName)) {
          throw new Error(
            `Operator Error: _type.type must be a string. Received: ${JSON.stringify(
              params
            )} at ${location}.`
          );
        }
        const on = Object.prototype.hasOwnProperty.call(params, 'on')
          ? params.on
          : get(state, get(params, 'key', { default: location }));
        switch (typeName) {
          case 'string':
            return type.isString(on);
          case 'array':
            return type.isArray(on);
          case 'date':
            return type.isDate(on); // Testing for date is problematic due to stringify
          case 'object':
            return type.isObject(on);
          case 'boolean':
            return type.isBoolean(on);
          case 'number':
            return type.isNumber(on);
          case 'integer':
            return type.isInt(on);
          case 'null':
            return type.isNull(on);
          case 'undefined':
            return type.isUndefined(on);
          case 'none':
            return type.isNone(on);
          case 'primitive':
            return type.isPrimitive(on);
          default:
            throw new Error(
              `Operator Error: "${typeName}" is not a valid _type test. Received: ${JSON.stringify(
                params
              )} at ${location}.`
            );
        }
      },
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

test('RestValidation after required field', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            id: 'text1',
            blockId: 'text1',
            type: 'TextInput',
            meta: {
              category: 'input',
              valueType: 'string',
            },
            required: true,
          },
          {
            id: 'button',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'validate',
                  type: 'Validate',
                },
              ],
            },
          },
          {
            id: 'reset',
            blockId: 'reset',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'reset',
                  type: 'ResetValidation',
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
    operators: lowdefy._internal.operators,
  });
  const button = context._internal.RootBlocks.map['button'];
  const reset = context._internal.RootBlocks.map['reset'];
  const text1 = context._internal.RootBlocks.map['text1'];
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
      error: {
        error: new Error('Your input has 1 validation error.'),
        index: 0,
        type: 'Validate',
      },
    },
    responses: {
      validate: {
        type: 'Validate',
        index: 0,
        error: new Error('Your input has 1 validation error.'),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(text1.eval.validation).toEqual({
    errors: ['This field is required'],
    status: 'error',
    warnings: [],
  });
  expect(displayMessage.mock.calls).toEqual([
    [
      {
        content: 'Your input has 1 validation error.',
        duration: 6,
        status: 'error',
      },
    ],
  ]);
  displayMessage.mockReset();
  displayMessage.mockImplementation(() => closeLoader);
  await reset.triggerEvent({ name: 'onClick' });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    bounced: false,
    endTimestamp: {
      date: 0,
    },
    error: {
      action: {
        id: 'validate',
        type: 'Validate',
      },
      error: {
        error: new Error('Your input has 1 validation error.'),
        index: 0,
        type: 'Validate',
      },
    },
    event: undefined,
    eventName: 'onClick',
    responses: {
      validate: {
        error: new Error('Your input has 1 validation error.'),
        index: 0,
        type: 'Validate',
      },
    },
    startTimestamp: {
      date: 0,
    },
    success: false,
  });
  expect(text1.eval.validation).toEqual({
    errors: ['This field is required'],
    status: null,
    warnings: [],
  });
  expect(displayMessage.mock.calls).toEqual([]);
});
