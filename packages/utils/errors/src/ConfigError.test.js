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

import ConfigError from './ConfigError.js';

test('ConfigError creates error with message only', () => {
  const error = new ConfigError('Test error message');
  expect(error.message).toBe('Test error message');
  expect(error.name).toBe('ConfigError');
  expect(error.isLowdefyError).toBe(true);
  expect(error.configKey).toBeNull();
  expect(error.source).toBeNull();
  expect(error.config).toBeNull();
  expect(error.filePath).toBeNull();
  expect(error.lineNumber).toBeNull();
});

test('ConfigError string form allows configKey to be added later', () => {
  const error = new ConfigError('Plugin detected config issue');
  expect(error.configKey).toBeNull();

  // Interface layer adds configKey
  error.configKey = 'abc123';
  expect(error.configKey).toBe('abc123');
});

test('ConfigError stores configKey', () => {
  const error = new ConfigError('Test error', { configKey: 'abc123' });
  expect(error.configKey).toBe('abc123');
});

test('ConfigError stores checkSlug', () => {
  const error = new ConfigError('Test error', { checkSlug: 'block-types' });
  expect(error.checkSlug).toBe('block-types');
});

test('ConfigError stores filePath and lineNumber', () => {
  const error = new ConfigError('Error parsing file', {
    filePath: 'pages/home.yaml',
    lineNumber: 6,
  });
  expect(error.message).toBe('Error parsing file');
  expect(error.filePath).toBe('pages/home.yaml');
  expect(error.lineNumber).toBe(6);
  expect(error.source).toBeNull();
  expect(error.config).toBeNull();
});

test('ConfigError is an instance of Error', () => {
  const error = new ConfigError('Test');
  expect(error instanceof Error).toBe(true);
  expect(error instanceof ConfigError).toBe(true);
});

test('ConfigError constructor wraps existing error via cause', () => {
  const original = new Error('Original error');
  const configError = new ConfigError(original.message, { cause: original, configKey: 'key123' });

  expect(configError.message).toBe('Original error');
  expect(configError.configKey).toBe('key123');
  expect(configError.cause).toBe(original);
});

test('ConfigError sets cause when wrapping an error', () => {
  const original = new Error('Wrapped');
  const configError = new ConfigError(original.message, { cause: original });

  expect(configError.cause).toBe(original);
});

test('ConfigError cause is undefined when no error is wrapped', () => {
  const configError = new ConfigError('No cause');

  expect(configError.cause).toBeUndefined();
});

test('ConfigError falls back to cause message when message is undefined', () => {
  const original = new Error('Fallback');
  const configError = new ConfigError(undefined, { cause: original });

  expect(configError.message).toBe('Fallback');
});

test('ConfigError constructor preserves configKey from cause error', () => {
  const original = new Error('Original error');
  original.configKey = 'original_key';
  const configError = new ConfigError(original.message, { cause: original });

  expect(configError.configKey).toBe('original_key');
});

test('ConfigError constructor uses provided configKey over cause', () => {
  const original = new Error('Original error');
  original.configKey = 'original_key';
  const configError = new ConfigError(original.message, {
    cause: original,
    configKey: 'new_key',
  });

  // Provided configKey takes precedence
  expect(configError.configKey).toBe('new_key');
});

test('ConfigError has isLowdefyError marker', () => {
  const error = new ConfigError('Test');
  expect(error.isLowdefyError).toBe(true);
});

test('ConfigError stores received value', () => {
  const error = new ConfigError('Bad value', { received: 42, configKey: 'key' });
  expect(error.received).toBe(42);
});
