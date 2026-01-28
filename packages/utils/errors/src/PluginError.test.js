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

test('PluginError creates error with message only', () => {
  const error = new PluginError({ message: 'Test error message' });
  expect(error.message).toBe('[Plugin Error] Test error message');
  expect(error.name).toBe('PluginError');
  expect(error.rawMessage).toBe('Test error message');
  expect(error.configKey).toBeNull();
});

test('PluginError stores plugin metadata', () => {
  const error = new PluginError({
    message: 'Invalid params',
    pluginType: 'operator',
    pluginName: '_if',
  });
  expect(error.pluginType).toBe('operator');
  expect(error.pluginName).toBe('_if');
});

test('PluginError includes received value in message', () => {
  const error = new PluginError({
    message: 'Invalid params',
    received: { test: true },
  });
  expect(error.message).toBe('[Plugin Error] Invalid params Received: {"test":true}');
  expect(error.received).toEqual({ test: true });
});

test('PluginError handles unserializable received value', () => {
  const circular = {};
  circular.self = circular;

  const error = new PluginError({
    message: 'Invalid params',
    received: circular,
  });
  expect(error.message).toBe('[Plugin Error] Invalid params Received: [unserializable]');
});

test('PluginError includes location in message', () => {
  const error = new PluginError({
    message: 'Invalid params',
    location: 'blocks.0.properties.visible',
  });
  expect(error.message).toBe('[Plugin Error] Invalid params at blocks.0.properties.visible.');
  expect(error.location).toBe('blocks.0.properties.visible');
});

test('PluginError with all fields', () => {
  const error = new PluginError({
    message: '_if requires boolean test',
    pluginType: 'operator',
    pluginName: '_if',
    received: 'string',
    location: 'blocks.0.visible',
    configKey: 'key123',
  });
  expect(error.message).toBe(
    '[Plugin Error] _if requires boolean test Received: "string" at blocks.0.visible.'
  );
  expect(error.pluginType).toBe('operator');
  expect(error.pluginName).toBe('_if');
  expect(error.received).toBe('string');
  expect(error.location).toBe('blocks.0.visible');
  expect(error.configKey).toBe('key123');
});

test('PluginError is an instance of Error', () => {
  const error = new PluginError({ message: 'Test' });
  expect(error instanceof Error).toBe(true);
  expect(error instanceof PluginError).toBe(true);
});

test('PluginError.from creates error from existing error', () => {
  const original = new Error('Original plugin error');
  const pluginError = PluginError.from({
    error: original,
    pluginType: 'action',
    pluginName: 'SetState',
    location: 'events.onClick',
  });

  expect(pluginError.message).toBe('[Plugin Error] Original plugin error at events.onClick.');
  expect(pluginError.pluginType).toBe('action');
  expect(pluginError.pluginName).toBe('SetState');
  expect(pluginError.cause).toBe(original);
});

test('PluginError.from preserves configKey from original error', () => {
  const original = new Error('Error');
  original.configKey = 'original_key';
  const pluginError = PluginError.from({ error: original, pluginType: 'operator' });

  expect(pluginError.configKey).toBe('original_key');
});

test('PluginError.from with received value', () => {
  const original = new Error('Invalid input');
  const pluginError = PluginError.from({
    error: original,
    pluginType: 'operator',
    pluginName: '_get',
    received: [1, 2, 3],
  });

  expect(pluginError.message).toBe('[Plugin Error] Invalid input Received: [1,2,3]');
  expect(pluginError.received).toEqual([1, 2, 3]);
});

test('PluginError preserves original stack trace', () => {
  const original = new Error('Original');
  const pluginError = PluginError.from({ error: original, pluginType: 'block' });

  expect(pluginError.stack).toBe(original.stack);
});
