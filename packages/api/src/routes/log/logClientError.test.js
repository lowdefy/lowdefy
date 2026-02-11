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

import logClientError from './logClientError.js';

const keyMap = {
  'key-123': {
    key: 'root.pages[0:home].blocks[0:header]',
    '~r': 'ref-1',
    '~l': 8,
  },
};

const refMap = {
  'ref-1': {
    path: 'pages/home.yaml',
  },
};

describe('logClientError', () => {
  test('logs ConfigError without configKey', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn(),
    };

    const result = await logClientError(context, {
      '~err': 'ConfigError',
      message: 'Test error',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('Test error');
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('ConfigError');
    expect(loggedError.message).toBe('Test error');
    expect(context.readConfigFile).not.toHaveBeenCalled();
  });

  test('logs ConfigError with configKey and resolves location', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'ConfigError',
      message: 'Test error',
      configKey: 'key-123',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('pages/home.yaml:8');
    expect(result.config).toBe('root.pages[0:home].blocks[0:header]');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('Test error');
    expect(result.errors[0].source).toBe('pages/home.yaml:8');
    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('ConfigError');
    expect(loggedError.message).toBe('Test error');
    expect(loggedError.source).toBe('pages/home.yaml:8');
  });

  test('logs PluginError with configKey and resolves location', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Operator failed',
      configKey: 'key-123',
      pluginType: 'operator',
      pluginName: '_if',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('pages/home.yaml:8');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('Operator failed');
    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(loggedError.message).toBe('Operator failed');
    expect(loggedError.source).toBe('pages/home.yaml:8');
  });

  test('logs ServiceError', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn(),
    };

    const result = await logClientError(context, {
      '~err': 'ServiceError',
      message: 'MongoDB: Connection refused',
      service: 'MongoDB',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe('MongoDB: Connection refused');
    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('ServiceError');
    expect(loggedError.message).toBe('MongoDB: Connection refused');
    expect(context.readConfigFile).not.toHaveBeenCalled();
  });

  test('handles missing configKey in keyMap', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'keyMap.json') return Promise.resolve({});
        if (file === 'refMap.json') return Promise.resolve({});
      }),
    };

    const result = await logClientError(context, {
      '~err': 'ConfigError',
      message: 'Test error',
      configKey: 'non-existent-key',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBeNull();
    expect(result.errors).toHaveLength(1);
    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('ConfigError');
    expect(loggedError.message).toBe('Test error');
    expect(loggedError.source).toBeUndefined();
  });

  test('handles error when loading maps', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn(() => Promise.reject(new Error('File not found'))),
    };

    const result = await logClientError(context, {
      '~err': 'ConfigError',
      message: 'Test error',
      configKey: 'key-123',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(mockLogger.warn).toHaveBeenCalledWith({
      event: 'warn_maps_load_failed',
      error: 'File not found',
    });
    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('ConfigError');
    expect(loggedError.message).toBe('Test error');
  });

  test('converts block PluginError to ConfigError when properties fail schema validation', async () => {
    const blockSchemas = {
      Box: {
        properties: {
          type: 'object',
          additionalProperties: false,
          properties: {
            content: { type: 'string' },
            style: { type: 'object' },
          },
        },
      },
    };
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/blockSchemas.json') return Promise.resolve(blockSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Block render failed',
      pluginType: 'block',
      pluginName: 'header',
      blockType: 'Box',
      properties: { content: 123, unknownProp: true },
      configKey: 'key-123',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('pages/home.yaml:8');
    expect(result.errors).toHaveLength(2);
    expect(mockLogger.error).toHaveBeenCalledTimes(2);
    const loggedMessages = mockLogger.error.mock.calls.map((call) => call[0].message);
    expect(loggedMessages).toContain('Block "Box" property "unknownProp" is not allowed.');
    expect(loggedMessages).toContain(
      'Block "Box" property "content" must be type "string". Received 123 (number).'
    );
    mockLogger.error.mock.calls.forEach((call) => {
      expect(call[0].name).toBe('ConfigError');
      expect(call[0].source).toBe('pages/home.yaml:8');
    });
  });

  test('keeps block PluginError when properties pass schema validation', async () => {
    const blockSchemas = {
      Box: {
        properties: {
          type: 'object',
          additionalProperties: false,
          properties: {
            content: { type: 'string' },
            style: { type: 'object' },
          },
        },
      },
    };
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/blockSchemas.json') return Promise.resolve(blockSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Block render failed',
      pluginType: 'block',
      pluginName: 'header',
      blockType: 'Box',
      properties: { content: 'hello' },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(loggedError.message).toBe('Block render failed');
  });

  test('keeps block PluginError when blockType has no schema', async () => {
    const blockSchemas = {};
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/blockSchemas.json') return Promise.resolve(blockSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Block render failed',
      pluginType: 'block',
      pluginName: 'header',
      blockType: 'CustomBlock',
      properties: { anything: true },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
  });

  test('keeps block PluginError when blockSchemas.json fails to load', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/blockSchemas.json') {
          return Promise.reject(new Error('File not found'));
        }
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Block render failed',
      pluginType: 'block',
      pluginName: 'header',
      blockType: 'Box',
      properties: { content: 123 },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(mockLogger.warn).toHaveBeenCalledWith({
      event: 'warn_block_schema_load_failed',
      error: 'File not found',
    });
  });

  test('skips block validation when blockType is missing from PluginError', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Block render failed',
      pluginType: 'block',
      pluginName: 'header',
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(context.readConfigFile).not.toHaveBeenCalledWith('plugins/blockSchemas.json');
  });

  test('converts action PluginError to ConfigError when params fail schema validation', async () => {
    const actionSchemas = {
      Wait: {
        params: {
          type: 'object',
          required: ['ms'],
          properties: {
            ms: { type: 'integer' },
          },
          additionalProperties: false,
        },
      },
    };
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/actionSchemas.json') return Promise.resolve(actionSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Wait action "ms" param should be an integer.',
      pluginType: 'action',
      pluginName: 'Wait',
      received: { ms: 'abc' },
      configKey: 'key-123',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('pages/home.yaml:8');
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(mockLogger.error).toHaveBeenCalled();
    const loggedMessages = mockLogger.error.mock.calls.map((call) => call[0].message);
    expect(loggedMessages).toContain(
      'Action "Wait" param "ms" must be type "integer". Received "abc" (string).'
    );
    mockLogger.error.mock.calls.forEach((call) => {
      expect(call[0].name).toBe('ConfigError');
      expect(call[0].source).toBe('pages/home.yaml:8');
    });
  });

  test('keeps action PluginError when params pass schema validation', async () => {
    const actionSchemas = {
      Wait: {
        params: {
          type: 'object',
          required: ['ms'],
          properties: {
            ms: { type: 'integer' },
          },
          additionalProperties: false,
        },
      },
    };
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/actionSchemas.json') return Promise.resolve(actionSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Some unexpected error',
      pluginType: 'action',
      pluginName: 'Wait',
      received: { ms: 1000 },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(loggedError.message).toBe('Some unexpected error');
  });

  test('keeps action PluginError when actionType has no schema', async () => {
    const actionSchemas = {};
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/actionSchemas.json') return Promise.resolve(actionSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Action failed',
      pluginType: 'action',
      pluginName: 'CustomAction',
      received: { anything: true },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
  });

  test('keeps action PluginError when actionSchemas.json fails to load', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/actionSchemas.json') {
          return Promise.reject(new Error('File not found'));
        }
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Action failed',
      pluginType: 'action',
      pluginName: 'Wait',
      received: { ms: 'abc' },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(mockLogger.warn).toHaveBeenCalledWith({
      event: 'warn_action_schema_load_failed',
      error: 'File not found',
    });
  });

  test('skips action validation when pluginName is missing from PluginError', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Action failed',
      pluginType: 'action',
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(context.readConfigFile).not.toHaveBeenCalledWith('plugins/actionSchemas.json');
  });

  test('converts operator PluginError to ConfigError when params fail schema validation', async () => {
    const operatorSchemas = {
      _if: {
        params: {
          type: 'object',
          required: ['test'],
          properties: {
            test: { type: 'boolean' },
            then: {},
            else: {},
          },
          additionalProperties: false,
        },
      },
    };
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/operatorSchemas.json') return Promise.resolve(operatorSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: '_if takes a boolean type for parameter test.',
      pluginType: 'operator',
      pluginName: '_if',
      received: { _if: { test: 'not_boolean', then: 'yes' } },
      configKey: 'key-123',
    });

    expect(result.success).toBe(true);
    expect(result.source).toBe('pages/home.yaml:8');
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(mockLogger.error).toHaveBeenCalled();
    const loggedMessages = mockLogger.error.mock.calls.map((call) => call[0].message);
    expect(loggedMessages).toContain(
      'Operator "_if" param "test" must be type "boolean". Received "not_boolean" (string).'
    );
    mockLogger.error.mock.calls.forEach((call) => {
      expect(call[0].name).toBe('ConfigError');
      expect(call[0].source).toBe('pages/home.yaml:8');
    });
  });

  test('keeps operator PluginError when params pass schema validation', async () => {
    const operatorSchemas = {
      _if: {
        params: {
          type: 'object',
          required: ['test'],
          properties: {
            test: { type: 'boolean' },
            then: {},
            else: {},
          },
          additionalProperties: false,
        },
      },
    };
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/operatorSchemas.json') return Promise.resolve(operatorSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Some unexpected error',
      pluginType: 'operator',
      pluginName: '_if',
      received: { _if: { test: true, then: 'yes' } },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(loggedError.message).toBe('Some unexpected error');
  });

  test('keeps operator PluginError when operator has no schema', async () => {
    const operatorSchemas = {};
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/operatorSchemas.json') return Promise.resolve(operatorSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Operator failed',
      pluginType: 'operator',
      pluginName: '_custom_op',
      received: { _custom_op: { anything: true } },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
  });

  test('keeps operator PluginError when operatorSchemas.json fails to load', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/operatorSchemas.json') {
          return Promise.reject(new Error('File not found'));
        }
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Operator failed',
      pluginType: 'operator',
      pluginName: '_if',
      received: { _if: { test: 'bad' } },
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(mockLogger.warn).toHaveBeenCalledWith({
      event: 'warn_operator_schema_load_failed',
      error: 'File not found',
    });
  });

  test('skips operator validation when pluginName is missing from PluginError', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: 'Operator failed',
      pluginType: 'operator',
      configKey: 'key-123',
    });

    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('PluginError');
    expect(context.readConfigFile).not.toHaveBeenCalledWith('plugins/operatorSchemas.json');
  });

  test('extracts params from operator received value for validation', async () => {
    const operatorSchemas = {
      _eq: {
        params: {
          type: 'array',
          minItems: 2,
          maxItems: 2,
        },
      },
    };
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/operatorSchemas.json') return Promise.resolve(operatorSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const result = await logClientError(context, {
      '~err': 'PluginError',
      message: '_eq takes an array of length 2 as input.',
      pluginType: 'operator',
      pluginName: '_eq',
      received: { _eq: [1, 2, 3] },
      configKey: 'key-123',
    });

    expect(result.success).toBe(true);
    expect(mockLogger.error).toHaveBeenCalled();
    const loggedMessages = mockLogger.error.mock.calls.map((call) => call[0].message);
    expect(loggedMessages.some((m) => m.includes('_eq'))).toBe(true);
    mockLogger.error.mock.calls.forEach((call) => {
      expect(call[0].name).toBe('ConfigError');
    });
  });
});
