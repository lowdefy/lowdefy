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

import ConfigError from './ConfigError.js';

test('ConfigError creates error with message only (object)', () => {
  const error = new ConfigError({ message: 'Test error message' });
  expect(error.message).toBe('[Config Error] Test error message');
  expect(error.name).toBe('ConfigError');
  expect(error.rawMessage).toBe('Test error message');
  expect(error.configKey).toBeNull();
  expect(error.source).toBeNull();
  expect(error.link).toBeNull();
  expect(error.resolved).toBe(false);
});

test('ConfigError creates error with string message (simple form for plugins)', () => {
  const error = new ConfigError('Simple error message');
  expect(error.message).toBe('[Config Error] Simple error message');
  expect(error.name).toBe('ConfigError');
  expect(error.rawMessage).toBe('Simple error message');
  expect(error.configKey).toBeNull();
  expect(error.source).toBeNull();
  expect(error.link).toBeNull();
  expect(error.resolved).toBe(false);
});

test('ConfigError string form allows configKey to be added later', () => {
  const error = new ConfigError('Plugin detected config issue');
  expect(error.configKey).toBeNull();

  // Interface layer adds configKey
  error.configKey = 'abc123';
  expect(error.configKey).toBe('abc123');
});

test('ConfigError stores configKey', () => {
  const error = new ConfigError({ message: 'Test error', configKey: 'abc123' });
  expect(error.configKey).toBe('abc123');
});

test('ConfigError stores checkSlug', () => {
  const error = new ConfigError({ message: 'Test error', checkSlug: 'block-types' });
  expect(error.checkSlug).toBe('block-types');
});

test('ConfigError with pre-resolved location includes source in message', () => {
  const error = new ConfigError({
    message: 'Invalid block type',
    location: {
      source: 'pages/home.yaml:42',
      link: '/path/to/pages/home.yaml:42',
      config: 'root.pages[0:home].blocks[0:header]',
    },
  });
  expect(error.message).toBe('pages/home.yaml:42\n[Config Error] Invalid block type');
  expect(error.source).toBe('pages/home.yaml:42');
  expect(error.link).toBe('/path/to/pages/home.yaml:42');
  expect(error.config).toBe('root.pages[0:home].blocks[0:header]');
  expect(error.resolved).toBe(true);
});

test('ConfigError is an instance of Error', () => {
  const error = new ConfigError({ message: 'Test' });
  expect(error instanceof Error).toBe(true);
  expect(error instanceof ConfigError).toBe(true);
});

test('ConfigError.from creates error from existing error', () => {
  const original = new Error('Original error');
  const configError = ConfigError.from({ error: original, configKey: 'key123' });

  expect(configError.message).toBe('[Config Error] Original error');
  expect(configError.configKey).toBe('key123');
  expect(configError.stack).toBe(original.stack);
});

test('ConfigError.from preserves configKey from original error', () => {
  const original = new Error('Original error');
  original.configKey = 'original_key';
  const configError = ConfigError.from({ error: original });

  expect(configError.configKey).toBe('original_key');
});

test('ConfigError.from uses provided configKey over original', () => {
  const original = new Error('Original error');
  original.configKey = 'original_key';
  const configError = ConfigError.from({ error: original, configKey: 'new_key' });

  // Provided configKey takes precedence
  expect(configError.configKey).toBe('original_key');
});

test('ConfigError.from with location', () => {
  const original = new Error('Parse error');
  const configError = ConfigError.from({
    error: original,
    location: { source: 'config.yaml:10', link: '/path/config.yaml:10' },
  });

  expect(configError.message).toBe('config.yaml:10\n[Config Error] Parse error');
  expect(configError.source).toBe('config.yaml:10');
  expect(configError.resolved).toBe(true);
});

test('ConfigError _updateMessage updates message with source', () => {
  const error = new ConfigError({ message: 'Test error' });
  expect(error.message).toBe('[Config Error] Test error');

  error.source = 'updated.yaml:5';
  error._updateMessage();

  expect(error.message).toBe('updated.yaml:5\n[Config Error] Test error');
});
