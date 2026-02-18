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

import PluginError from './PluginError.js';

test('PluginError wraps error with message via cause', () => {
  const original = new Error('Test error message');
  const error = new PluginError(original.message, { cause: original });
  expect(error.message).toBe('Test error message');
  expect(error.name).toBe('PluginError');
  expect(error.isLowdefyError).toBe(true);
  expect(error.configKey).toBeNull();
  expect(error.cause).toBe(original);
});

test('PluginError falls back to cause message when message is undefined', () => {
  const original = new Error('Fallback message');
  const error = new PluginError(undefined, { cause: original });
  expect(error.message).toBe('Fallback message');
});

test('PluginError stores typeName', () => {
  const original = new Error('Invalid params');
  const error = new PluginError(original.message, {
    cause: original,
    typeName: '_if',
  });
  expect(error.typeName).toBe('_if');
});

test('PluginError stores received value for logger formatting', () => {
  const original = new Error('Invalid params');
  const error = new PluginError(original.message, {
    cause: original,
    received: { test: true },
  });
  // Message does NOT include received - logger formats it
  expect(error.message).toBe('Invalid params');
  expect(error.received).toEqual({ test: true });
});

test('PluginError stores unserializable received value', () => {
  const circular = {};
  circular.self = circular;

  const original = new Error('Invalid params');
  const error = new PluginError(original.message, {
    cause: original,
    received: circular,
  });
  // Message does NOT include received - logger handles formatting
  expect(error.message).toBe('Invalid params');
  expect(error.received).toBe(circular);
});

test('PluginError includes location in message', () => {
  const original = new Error('Invalid params');
  const error = new PluginError(original.message, {
    cause: original,
    location: 'blocks.0.properties.visible',
  });
  expect(error.message).toBe('Invalid params at blocks.0.properties.visible.');
  expect(error.location).toBe('blocks.0.properties.visible');
});

test('PluginError with all fields', () => {
  const original = new Error('_if requires boolean test');
  const error = new PluginError(original.message, {
    cause: original,
    typeName: '_if',
    received: 'string',
    location: 'blocks.0.visible',
    configKey: 'key123',
  });
  // Message includes location but NOT received - logger formats received
  expect(error.message).toBe('_if requires boolean test at blocks.0.visible.');
  expect(error.typeName).toBe('_if');
  expect(error.received).toBe('string');
  expect(error.location).toBe('blocks.0.visible');
  expect(error.configKey).toBe('key123');
});

test('PluginError is an instance of Error', () => {
  const original = new Error('Test');
  const error = new PluginError(original.message, { cause: original });
  expect(error instanceof Error).toBe(true);
  expect(error instanceof PluginError).toBe(true);
});

test('PluginError preserves configKey from cause error', () => {
  const original = new Error('Error');
  original.configKey = 'original_key';
  const pluginError = new PluginError(original.message, { cause: original, typeName: '_get' });

  expect(pluginError.configKey).toBe('original_key');
});

test('PluginError uses provided configKey when cause has none', () => {
  const original = new Error('Error');
  const pluginError = new PluginError(original.message, {
    cause: original,
    typeName: '_get',
    configKey: 'provided_key',
  });

  expect(pluginError.configKey).toBe('provided_key');
});

test('PluginError configKey from cause takes precedence over options configKey', () => {
  const original = new Error('Error');
  original.configKey = 'cause_key';
  const pluginError = new PluginError(original.message, {
    cause: original,
    typeName: '_get',
    configKey: 'options_key',
  });

  expect(pluginError.configKey).toBe('cause_key');
});

test('PluginError preserves original error via cause chain', () => {
  const original = new Error('Original');
  const pluginError = new PluginError(original.message, { cause: original, typeName: 'Button' });

  expect(pluginError.cause).toBe(original);
});

test('PluginError works with no options', () => {
  const error = new PluginError('Direct message');
  expect(error.message).toBe('Direct message');
  expect(error.cause).toBeUndefined();
  expect(error.configKey).toBeNull();
});
