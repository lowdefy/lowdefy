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
      name: 'ConfigError',
      message: 'Test error',
    });

    expect(result).toEqual({
      success: true,
      source: null,
      config: null,
      link: null,
    });
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
      name: 'ConfigError',
      message: 'Test error',
      configKey: 'key-123',
    });

    expect(result).toEqual({
      success: true,
      source: 'pages/home.yaml:8',
      config: 'root.pages[0:home].blocks[0:header]',
      link: 'pages/home.yaml:8',
    });
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
      name: 'PluginError',
      message: 'Operator failed',
      configKey: 'key-123',
      pluginType: 'operator',
      pluginName: '_if',
    });

    expect(result).toEqual({
      success: true,
      source: 'pages/home.yaml:8',
      config: 'root.pages[0:home].blocks[0:header]',
      link: 'pages/home.yaml:8',
    });
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
      name: 'ServiceError',
      message: 'MongoDB: Connection refused',
      service: 'MongoDB',
    });

    expect(result).toEqual({
      success: true,
      source: null,
      config: null,
      link: null,
    });
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
      name: 'ConfigError',
      message: 'Test error',
      configKey: 'non-existent-key',
    });

    expect(result).toEqual({
      success: true,
      source: null,
      config: null,
      link: null,
    });
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
      name: 'ConfigError',
      message: 'Test error',
      configKey: 'key-123',
    });

    expect(result).toEqual({
      success: true,
      source: null,
      config: null,
      link: null,
    });
    expect(mockLogger.warn).toHaveBeenCalledWith({
      event: 'warn_maps_load_failed',
      error: 'File not found',
    });
    const loggedError = mockLogger.error.mock.calls[0][0];
    expect(loggedError.name).toBe('ConfigError');
    expect(loggedError.message).toBe('Test error');
  });
});
