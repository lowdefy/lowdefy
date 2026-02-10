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
import ConfigError from './ConfigError.js';
import BaseConfigError from '../ConfigError.js';

beforeEach(() => {
  jest.restoreAllMocks();
});

test('client ConfigError extends base ConfigError', () => {
  const error = new ConfigError({ message: 'Test error' });
  expect(error instanceof BaseConfigError).toBe(true);
  expect(error instanceof Error).toBe(true);
  expect(error.name).toBe('ConfigError');
});

test('client ConfigError creates error with message and configKey', () => {
  const error = new ConfigError({ message: 'Invalid operator', configKey: 'key123' });
  expect(error.message).toBe('Invalid operator');
  expect(error.configKey).toBe('key123');
  expect(error.resolved).toBe(false);
});

describe('resolve', () => {
  test('resolve fetches location from server and sets source/config/link', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        source: 'pages/home.yaml:42',
        config: 'root.pages[0:home]',
        link: '/path/to/pages/home.yaml:42',
      }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const error = new ConfigError({ message: 'Invalid block', configKey: 'abc' });
    const result = await error.resolve({ basePath: '/app' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/app/api/client-error',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      })
    );
    expect(error.source).toBe('pages/home.yaml:42');
    expect(error.config).toBe('root.pages[0:home]');
    expect(error.link).toBe('/path/to/pages/home.yaml:42');
    expect(error.resolved).toBe(true);
    expect(result).toBe(error);
  });

  test('resolve sends serialized error in body', async () => {
    const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({}) };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const error = new ConfigError({ message: 'Test', configKey: 'key1' });
    await error.resolve({ basePath: '' });

    const callArgs = global.fetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body).toEqual({
      '~err': 'ConfigError',
      message: 'Test',
      configKey: 'key1',
      source: null,
    });
  });

  test('resolve skips when already resolved', async () => {
    global.fetch = jest.fn();

    const error = new ConfigError({
      message: 'Already resolved',
      location: { source: 'file.yaml:1' },
    });
    expect(error.resolved).toBe(true);

    await error.resolve({ basePath: '/app' });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('resolve skips when lowdefy.basePath is undefined', async () => {
    global.fetch = jest.fn();

    const error = new ConfigError({ message: 'No basePath' });
    await error.resolve({});

    expect(global.fetch).not.toHaveBeenCalled();
    expect(error.resolved).toBe(true);
  });

  test('resolve skips when lowdefy is undefined', async () => {
    global.fetch = jest.fn();

    const error = new ConfigError({ message: 'No lowdefy' });
    await error.resolve(undefined);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(error.resolved).toBe(true);
  });

  test('resolve handles empty string basePath', async () => {
    const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({}) };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const error = new ConfigError({ message: 'Empty basePath', configKey: 'k' });
    await error.resolve({ basePath: '' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/client-error',
      expect.any(Object)
    );
  });

  test('resolve handles non-ok response gracefully', async () => {
    const mockResponse = { ok: false, status: 500 };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const error = new ConfigError({ message: 'Server error' });
    await error.resolve({ basePath: '' });

    expect(error.source).toBeNull();
    expect(error.resolved).toBe(true);
  });

  test('resolve handles fetch error gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const error = new ConfigError({ message: 'Fetch failed' });
    await error.resolve({ basePath: '' });

    expect(error.source).toBeNull();
    expect(error.resolved).toBe(true);
  });

  test('resolve does not fetch again after first resolve', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ source: 'file.yaml:1' }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const error = new ConfigError({ message: 'Test', configKey: 'k' });
    await error.resolve({ basePath: '' });
    await error.resolve({ basePath: '' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('log', () => {
  test('log resolves and logs to console', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ source: 'file.yaml:1' }),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new ConfigError({ message: 'Log test', configKey: 'k' });
    await error.log({ basePath: '' });

    expect(global.fetch).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(error.message);
  });

  test('log skips resolution when no lowdefy provided', async () => {
    global.fetch = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new ConfigError({ message: 'No resolve' });
    await error.log();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('No resolve');
  });

  test('log skips resolution when already resolved', async () => {
    global.fetch = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const error = new ConfigError({
      message: 'Pre-resolved',
      location: { source: 'file.yaml:1' },
    });
    await error.log({ basePath: '' });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('deserialize', () => {
  test('deserialize creates client ConfigError from data', () => {
    const data = {
      message: 'Test error',
      configKey: 'abc123',
      source: 'config.yaml:10',
    };
    const error = ConfigError.deserialize(data);

    expect(error instanceof ConfigError).toBe(true);
    expect(error instanceof BaseConfigError).toBe(true);
    expect(error.message).toBe('Test error');
    expect(error.configKey).toBe('abc123');
    expect(error.source).toBe('config.yaml:10');
  });

  test('deserialize handles missing source', () => {
    const data = { message: 'No source', configKey: null };
    const error = ConfigError.deserialize(data);

    expect(error.message).toBe('No source');
    expect(error.source).toBeUndefined();
  });
});
