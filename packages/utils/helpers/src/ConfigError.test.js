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

describe('ConfigError constructor', () => {
  test('creates error with message and configKey', () => {
    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.name).toBe('ConfigError');
    expect(error.message).toBe('Test error');
    expect(error.configKey).toBe('key-123');
    expect(error.resolved).toBe(false);
    expect(error.source).toBeNull();
    expect(error.config).toBeNull();
    expect(error.link).toBeNull();
  });

  test('creates error without configKey', () => {
    const error = new ConfigError({ message: 'Test error' });

    expect(error.message).toBe('Test error');
    expect(error.configKey).toBeUndefined();
  });
});

describe('ConfigError.from', () => {
  test('creates ConfigError from existing error', () => {
    const originalError = new Error('Original message');
    const configError = ConfigError.from({ error: originalError, configKey: 'key-456' });

    expect(configError).toBeInstanceOf(ConfigError);
    expect(configError.message).toBe('Original message');
    expect(configError.configKey).toBe('key-456');
    expect(configError.stack).toBe(originalError.stack);
  });

  test('preserves configKey from original error if present', () => {
    const originalError = new Error('Original message');
    originalError.configKey = 'original-key';
    const configError = ConfigError.from({ error: originalError, configKey: 'fallback-key' });

    expect(configError.configKey).toBe('original-key');
  });

  test('uses fallback configKey if original error has none', () => {
    const originalError = new Error('Original message');
    const configError = ConfigError.from({ error: originalError, configKey: 'fallback-key' });

    expect(configError.configKey).toBe('fallback-key');
  });
});

describe('ConfigError.format', () => {
  test('formats without location when not resolved', () => {
    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });

    expect(error.format()).toBe('[Config Error] Test error');
  });

  test('formats with location when resolved', () => {
    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });
    error.source = 'pages/home.yaml:10';
    error.config = 'root.pages[0].blocks[0]';
    error.link = '/app/pages/home.yaml:10';

    const formatted = error.format();
    expect(formatted).toContain('[Config Error] Test error');
    expect(formatted).toContain('pages/home.yaml:10 at root.pages[0].blocks[0]');
    expect(formatted).toContain('vscode://file/app/pages/home.yaml?line=10');
  });

  test('formats with location without line number', () => {
    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });
    error.source = 'pages/home.yaml';
    error.config = 'root.pages[0]';
    error.link = '/app/pages/home.yaml';

    const formatted = error.format();
    expect(formatted).toContain('vscode://file/app/pages/home.yaml');
  });
});

describe('ConfigError.resolve', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('resolves location from server', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        source: 'pages/home.yaml:10',
        config: 'root.pages[0].blocks[0]',
        link: '/app/pages/home.yaml:10',
      }),
    });

    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });
    const lowdefy = { basePath: '/api', pageId: 'home' };

    await error.resolve(lowdefy);

    expect(error.resolved).toBe(true);
    expect(error.source).toBe('pages/home.yaml:10');
    expect(error.config).toBe('root.pages[0].blocks[0]');
    expect(error.link).toBe('/app/pages/home.yaml:10');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/api/client-error',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  test('handles fetch failure gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });
    const lowdefy = { basePath: '/api', pageId: 'home' };

    await error.resolve(lowdefy);

    expect(error.resolved).toBe(true);
    expect(error.source).toBeNull();
  });

  test('handles non-ok response gracefully', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });
    const lowdefy = { basePath: '/api', pageId: 'home' };

    await error.resolve(lowdefy);

    expect(error.resolved).toBe(true);
    expect(error.source).toBeNull();
  });

  test('skips resolution without configKey', async () => {
    const error = new ConfigError({ message: 'Test error' });
    const lowdefy = { basePath: '/api', pageId: 'home' };

    await error.resolve(lowdefy);

    expect(error.resolved).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('skips resolution without lowdefy.basePath', async () => {
    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });

    await error.resolve({});

    expect(error.resolved).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns this for chaining', async () => {
    global.fetch.mockResolvedValueOnce({ ok: false });

    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });
    const lowdefy = { basePath: '/api', pageId: 'home' };

    const result = await error.resolve(lowdefy);

    expect(result).toBe(error);
  });
});

describe('ConfigError.log', () => {
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;

  beforeEach(() => {
    global.fetch = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  test('resolves and logs to console', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        source: 'pages/home.yaml:10',
        config: 'root.pages[0].blocks[0]',
        link: '/app/pages/home.yaml:10',
      }),
    });

    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });
    const lowdefy = { basePath: '/api', pageId: 'home' };

    await error.log(lowdefy);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[Config Error] Test error')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('pages/home.yaml:10')
    );
  });

  test('logs without location on resolution failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const error = new ConfigError({ message: 'Test error', configKey: 'key-123' });
    const lowdefy = { basePath: '/api', pageId: 'home' };

    await error.log(lowdefy);

    expect(console.error).toHaveBeenCalledWith('[Config Error] Test error');
  });
});
