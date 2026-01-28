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

import PluginError from './PluginError.js';

test('PluginError wraps error with message', () => {
  const original = new Error('Test error message');
  const error = new PluginError({ error: original });
  expect(error.message).toBe('Test error message');
  expect(error.name).toBe('PluginError');
  expect(error.configKey).toBeNull();
  expect(error.cause).toBe(original);
});

test('PluginError stores plugin metadata', () => {
  const original = new Error('Invalid params');
  const error = new PluginError({
    error: original,
    pluginType: 'operator',
    pluginName: '_if',
  });
  expect(error.pluginType).toBe('operator');
  expect(error.pluginName).toBe('_if');
});

test('PluginError includes received value in message', () => {
  const original = new Error('Invalid params');
  const error = new PluginError({
    error: original,
    received: { test: true },
  });
  expect(error.message).toBe('Invalid params Received: {"test":true}');
  expect(error.received).toEqual({ test: true });
});

test('PluginError handles unserializable received value', () => {
  const circular = {};
  circular.self = circular;

  const original = new Error('Invalid params');
  const error = new PluginError({
    error: original,
    received: circular,
  });
  expect(error.message).toBe('Invalid params Received: [unserializable]');
});

test('PluginError includes location in message', () => {
  const original = new Error('Invalid params');
  const error = new PluginError({
    error: original,
    location: 'blocks.0.properties.visible',
  });
  expect(error.message).toBe('Invalid params at blocks.0.properties.visible.');
  expect(error.location).toBe('blocks.0.properties.visible');
});

test('PluginError with all fields', () => {
  const original = new Error('_if requires boolean test');
  const error = new PluginError({
    error: original,
    pluginType: 'operator',
    pluginName: '_if',
    received: 'string',
    location: 'blocks.0.visible',
    configKey: 'key123',
  });
  expect(error.message).toBe('_if requires boolean test Received: "string" at blocks.0.visible.');
  expect(error.pluginType).toBe('operator');
  expect(error.pluginName).toBe('_if');
  expect(error.received).toBe('string');
  expect(error.location).toBe('blocks.0.visible');
  expect(error.configKey).toBe('key123');
});

test('PluginError is an instance of Error', () => {
  const original = new Error('Test');
  const error = new PluginError({ error: original });
  expect(error instanceof Error).toBe(true);
  expect(error instanceof PluginError).toBe(true);
});

test('PluginError preserves configKey from original error', () => {
  const original = new Error('Error');
  original.configKey = 'original_key';
  const pluginError = new PluginError({ error: original, pluginType: 'operator' });

  expect(pluginError.configKey).toBe('original_key');
});

test('PluginError uses provided configKey when original has none', () => {
  const original = new Error('Error');
  const pluginError = new PluginError({
    error: original,
    pluginType: 'operator',
    configKey: 'provided_key',
  });

  expect(pluginError.configKey).toBe('provided_key');
});

test('PluginError preserves original stack trace', () => {
  const original = new Error('Original');
  const pluginError = new PluginError({ error: original, pluginType: 'block' });

  expect(pluginError.stack).toBe(original.stack);
});
