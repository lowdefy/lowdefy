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

import { ConfigError, PluginError, ServiceError } from '@lowdefy/errors';
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
      link: null,
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
      new ConfigError({ message: 'Test error', configKey: 'key-123' })
    );
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: 'pages/home.yaml:8',
      config: 'root.pages[0:home].blocks[0:header]',
      link: 'pages/home.yaml:8',
    });
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('Test error');
    expect(error.source).toBe('pages/home.yaml:8');
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

    const data = serializer.serialize(
      new PluginError({
        message: 'Operator failed',
        configKey: 'key-123',
        pluginType: 'operator',
        pluginName: '_if',
      })
    );
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: 'pages/home.yaml:8',
      config: 'root.pages[0:home].blocks[0:header]',
      link: 'pages/home.yaml:8',
    });
    expect(error).toBeInstanceOf(PluginError);
    expect(error.name).toBe('PluginError');
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
      new ServiceError({ message: 'Connection refused', service: 'MongoDB' })
    );
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: null,
      config: null,
      link: null,
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
      new ConfigError({ message: 'Test error', configKey: 'non-existent-key' })
    );
    const { error, ...response } = await logClientError(context, data);

    expect(response).toEqual({
      success: true,
      source: null,
      config: null,
      link: null,
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

    const pluginError = new PluginError({
      message: 'Operator failed',
      pluginType: 'operator',
      pluginName: '_if',
      received: { sensitiveData: 'should not appear' },
    });
    const data = serializer.serialize(pluginError);
    // Simulate client-side stripping of received
    delete data['~e'].received;

    const { error } = await logClientError(context, data);

    expect(error).toBeInstanceOf(PluginError);
    expect(error.received).toBeUndefined();
  });
});
