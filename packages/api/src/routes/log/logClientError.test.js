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
  test('logs error without configKey', async () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    };
    const context = {
      logger: mockLogger,
      readConfigFile: jest.fn(),
    };

    const result = await logClientError(context, {
      message: 'Test error',
      name: 'Error',
      pageId: 'home',
      stack: 'Error stack',
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    expect(result).toEqual({
      success: true,
      source: null,
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'client_error',
        errorName: 'Error',
        errorMessage: 'Test error',
        pageId: 'home',
        source: null,
      }),
      'Client error: Test error'
    );
    expect(context.readConfigFile).not.toHaveBeenCalled();
  });

  test('logs error with configKey and resolves location', async () => {
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
      configKey: 'key-123',
      message: 'Test error',
      name: 'Error',
      pageId: 'home',
      stack: 'Error stack',
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    expect(result).toEqual({
      success: true,
      source: 'pages/home.yaml:8 at root.pages[0:home].blocks[0:header]',
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'client_error',
        errorName: 'Error',
        errorMessage: 'Test error',
        pageId: 'home',
        source: 'pages/home.yaml:8 at root.pages[0:home].blocks[0:header]',
      }),
      'Client error at pages/home.yaml:8 at root.pages[0:home].blocks[0:header]: Test error'
    );
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
      configKey: 'non-existent-key',
      message: 'Test error',
      name: 'Error',
      pageId: 'home',
      stack: 'Error stack',
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    expect(result).toEqual({
      success: true,
      source: null,
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        source: null,
      }),
      'Client error: Test error'
    );
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
      configKey: 'key-123',
      message: 'Test error',
      name: 'Error',
      pageId: 'home',
      stack: 'Error stack',
      timestamp: '2024-01-01T00:00:00.000Z',
    });

    expect(result).toEqual({
      success: true,
      source: null,
    });
    expect(mockLogger.warn).toHaveBeenCalledWith({
      event: 'warn_maps_load_failed',
      error: 'File not found',
    });
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        source: null,
      }),
      'Client error: Test error'
    );
  });
});
