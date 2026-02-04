/*
  Copyright 2020-2024 Lowdefy, Inc

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

const mockValidate = jest.fn();

jest.unstable_mockModule('@lowdefy/ajv', () => ({
  validate: mockValidate,
}));

jest.unstable_mockModule('@lowdefy/errors/client', () => ({
  ConfigError: class ConfigError {
    constructor({ message, configKey }) {
      this.message = message;
      this.configKey = configKey;
      this.name = 'ConfigError';
    }
  },
}));

test('validateBlockProperties returns early when component has no schema', async () => {
  const { default: validateBlockProperties } = await import('./validateBlockProperties.js');
  const logError = jest.fn();
  const block = {
    type: 'Box',
    blockId: 'block_1',
    eval: { properties: { title: 'Hello' } },
  };
  const lowdefy = {
    _internal: {
      blockComponents: {
        Box: { meta: { category: 'container' } },
      },
      logError,
    },
  };

  await validateBlockProperties({ block, lowdefy });
  expect(mockValidate).not.toHaveBeenCalled();
  expect(logError).not.toHaveBeenCalled();
});

test('validateBlockProperties returns early when schema has no properties key', async () => {
  const { default: validateBlockProperties } = await import('./validateBlockProperties.js');
  const logError = jest.fn();
  const block = {
    type: 'Box',
    blockId: 'block_1',
    eval: { properties: { title: 'Hello' } },
  };
  const lowdefy = {
    _internal: {
      blockComponents: {
        Box: { schema: { events: {} } },
      },
      logError,
    },
  };

  await validateBlockProperties({ block, lowdefy });
  expect(mockValidate).not.toHaveBeenCalled();
  expect(logError).not.toHaveBeenCalled();
});

test('validateBlockProperties does not log error when properties are valid', async () => {
  const { default: validateBlockProperties } = await import('./validateBlockProperties.js');
  const logError = jest.fn();
  mockValidate.mockReturnValue({ valid: true });

  const block = {
    type: 'Box',
    blockId: 'block_1',
    eval: {
      properties: { content: 'Hello' },
      configKey: '1a',
    },
  };
  const lowdefy = {
    _internal: {
      blockComponents: {
        Box: {
          schema: {
            properties: {
              type: 'object',
              additionalProperties: false,
              properties: {
                content: { type: 'string' },
              },
            },
          },
        },
      },
      logError,
    },
  };

  await validateBlockProperties({ block, lowdefy });
  expect(mockValidate).toHaveBeenCalledWith({
    schema: lowdefy._internal.blockComponents.Box.schema.properties,
    data: { content: 'Hello' },
    returnErrors: true,
  });
  expect(logError).not.toHaveBeenCalled();
});

test('validateBlockProperties logs ConfigError when properties are invalid', async () => {
  const { default: validateBlockProperties } = await import('./validateBlockProperties.js');
  const logError = jest.fn();
  mockValidate.mockReturnValue({
    valid: false,
    errors: [{ message: 'must be string' }],
  });

  const block = {
    type: 'Box',
    blockId: 'block_1',
    eval: {
      properties: { content: 123 },
      configKey: '1a',
    },
  };
  const lowdefy = {
    _internal: {
      blockComponents: {
        Box: {
          schema: {
            properties: {
              type: 'object',
              additionalProperties: false,
              properties: {
                content: { type: 'string' },
              },
            },
          },
        },
      },
      logError,
    },
  };

  await validateBlockProperties({ block, lowdefy });
  expect(logError).toHaveBeenCalledTimes(1);
  const error = logError.mock.calls[0][0];
  expect(error.name).toBe('ConfigError');
  expect(error.message).toBe('Block "block_1" of type "Box" has invalid properties.');
  expect(error.configKey).toBe('1a');
});

test('validateBlockProperties handles missing block.eval gracefully', async () => {
  const { default: validateBlockProperties } = await import('./validateBlockProperties.js');
  const logError = jest.fn();
  mockValidate.mockReturnValue({ valid: true });

  const block = {
    type: 'Box',
    blockId: 'block_1',
  };
  const lowdefy = {
    _internal: {
      blockComponents: {
        Box: {
          schema: {
            properties: {
              type: 'object',
              properties: {
                content: { type: 'string' },
              },
            },
          },
        },
      },
      logError,
    },
  };

  await validateBlockProperties({ block, lowdefy });
  expect(mockValidate).toHaveBeenCalledWith({
    schema: lowdefy._internal.blockComponents.Box.schema.properties,
    data: {},
    returnErrors: true,
  });
  expect(logError).not.toHaveBeenCalled();
});

test('validateBlockProperties returns early when block type not in blockComponents', async () => {
  const { default: validateBlockProperties } = await import('./validateBlockProperties.js');
  const logError = jest.fn();

  const block = {
    type: 'NonExistent',
    blockId: 'block_1',
    eval: { properties: {} },
  };
  const lowdefy = {
    _internal: {
      blockComponents: {},
      logError,
    },
  };

  await validateBlockProperties({ block, lowdefy });
  expect(mockValidate).not.toHaveBeenCalled();
  expect(logError).not.toHaveBeenCalled();
});
