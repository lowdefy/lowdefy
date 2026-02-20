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

import {
  ActionError,
  BlockError,
  ConfigError,
  OperatorError,
  ServiceError,
} from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

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

    const data = serializer.serialize(new ConfigError('Test error'));
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: null,
      config: null,
    });
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('Test error');
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

    const data = serializer.serialize(
      new ConfigError('Test error', { configKey: 'key-123' })
    );
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: 'pages/home.yaml:8',
      config: 'root.pages[0:home].blocks[0:header]',
    });
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('Test error');
    expect(error.source).toBe('pages/home.yaml:8');
  });

  test('logs OperatorError with configKey and resolves location', async () => {
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

    const data = serializer.serialize(
      new OperatorError('Operator failed', {
        configKey: 'key-123',
        typeName: '_if',
      })
    );
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: 'pages/home.yaml:8',
      config: 'root.pages[0:home].blocks[0:header]',
    });
    expect(error).toBeInstanceOf(OperatorError);
    expect(error.name).toBe('OperatorError');
    expect(error.message).toBe('Operator failed');
    expect(error.source).toBe('pages/home.yaml:8');
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

    const data = serializer.serialize(
      new ServiceError('Connection refused', { service: 'MongoDB' })
    );
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: null,
      config: null,
    });
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.name).toBe('ServiceError');
    expect(error.message).toBe('MongoDB: Connection refused');
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

    const data = serializer.serialize(
      new ConfigError('Test error', { configKey: 'non-existent-key' })
    );
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: null,
      config: null,
    });
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('Test error');
    expect(error.source).toBeNull();
  });

  test('strips received property from serialized data', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn(),
    };

    const operatorError = new OperatorError('Operator failed', {
      typeName: '_if',
      received: { sensitiveData: 'should not appear' },
    });
    const data = serializer.serialize(operatorError);
    // Simulate client-side stripping of received
    delete data['~e'].received;

    const { error } = await logClientError(context, data);

    expect(error).toBeInstanceOf(OperatorError);
    expect(error.received).toBeUndefined();
  });
});

describe('logClientError schema validation', () => {
  test('ActionError with received that fails schema returns ConfigErrors', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const actionSchemas = {
      SetState: {
        params: {
          type: 'object',
          properties: {
            value: { type: 'string' },
          },
          required: ['value'],
        },
      },
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/actionSchemas.json') return Promise.resolve(actionSchemas);
        if (file === 'keyMap.json') return Promise.resolve(keyMap);
        if (file === 'refMap.json') return Promise.resolve(refMap);
      }),
    };

    const data = serializer.serialize(
      new ActionError('Something broke', {
        typeName: 'SetState',
        received: { notValue: 123 },
        configKey: 'key-123',
      })
    );

    const result = await logClientError(context, data);

    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
    // Each error should be a serialized ConfigError
    const deserializedError = serializer.deserialize(result.errors[0]);
    expect(deserializedError).toBeInstanceOf(ConfigError);
    expect(deserializedError.message).toContain('SetState');
    // Original error is still returned
    expect(result.error).toBeInstanceOf(ActionError);
    // Logger should have been called with ConfigErrors, not original
    expect(mockLogger.error).toHaveBeenCalled();
    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError).toBeInstanceOf(ConfigError);
  });

  test('OperatorError with method-style received extracts params correctly', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const operatorSchemas = {
      _yaml: {
        params: {
          type: 'object',
          properties: {
            on: { type: 'string' },
          },
          required: ['on'],
        },
      },
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/operatorSchemas.json') return Promise.resolve(operatorSchemas);
        if (file === 'keyMap.json') return Promise.resolve({});
        if (file === 'refMap.json') return Promise.resolve({});
      }),
    };

    const data = serializer.serialize(
      new OperatorError('yaml parse failed', {
        typeName: '_yaml',
        methodName: 'parse',
        received: { '_yaml.parse': { notOn: 123 } },
      })
    );

    const result = await logClientError(context, data);

    expect(result.errors).toBeDefined();
    const deserializedError = serializer.deserialize(result.errors[0]);
    expect(deserializedError).toBeInstanceOf(ConfigError);
    // Display name should include methodName
    expect(deserializedError.message).toContain('_yaml.parse');
  });

  test('BlockError with received that passes schema keeps original error', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const blockSchemas = {
      Button: {
        properties: {
          type: 'object',
          properties: {
            title: { type: 'string' },
          },
        },
      },
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/blockSchemas.json') return Promise.resolve(blockSchemas);
        if (file === 'keyMap.json') return Promise.resolve({});
        if (file === 'refMap.json') return Promise.resolve({});
      }),
    };

    const data = serializer.serialize(
      new BlockError('Render failed', {
        typeName: 'Button',
        received: { title: 'Click me' },
      })
    );

    const result = await logClientError(context, data);

    expect(result.errors).toBeUndefined();
    expect(result.error).toBeInstanceOf(BlockError);
    // Original error should be logged, not ConfigError
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error.mock.calls[0][0]).toBeInstanceOf(BlockError);
  });

  test('missing schema file keeps original error', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn((file) => {
        if (file === 'plugins/actionSchemas.json') throw new Error('File not found');
        if (file === 'keyMap.json') return Promise.resolve({});
        if (file === 'refMap.json') return Promise.resolve({});
      }),
    };

    const data = serializer.serialize(
      new ActionError('Something broke', {
        typeName: 'SetState',
        received: { badParam: true },
      })
    );

    const result = await logClientError(context, data);

    expect(result.errors).toBeUndefined();
    expect(result.error).toBeInstanceOf(ActionError);
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error.mock.calls[0][0]).toBeInstanceOf(ActionError);
  });

  test('no received on error skips validation', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn(),
    };

    const data = serializer.serialize(
      new ActionError('Something broke', {
        typeName: 'SetState',
      })
    );

    const result = await logClientError(context, data);

    expect(result.errors).toBeUndefined();
    expect(result.error).toBeInstanceOf(ActionError);
    // readConfigFile should not be called for schema files
    expect(context.readConfigFile).not.toHaveBeenCalledWith('plugins/actionSchemas.json');
  });

  test('ConfigError skips validation', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn(),
    };

    const data = serializer.serialize(
      new ConfigError('Already a config error')
    );

    const result = await logClientError(context, data);

    expect(result.errors).toBeUndefined();
    expect(result.error).toBeInstanceOf(ConfigError);
    // Should not try to load any schema files
    expect(context.readConfigFile).not.toHaveBeenCalledWith('plugins/actionSchemas.json');
    expect(context.readConfigFile).not.toHaveBeenCalledWith('plugins/blockSchemas.json');
    expect(context.readConfigFile).not.toHaveBeenCalledWith('plugins/operatorSchemas.json');
  });
});
