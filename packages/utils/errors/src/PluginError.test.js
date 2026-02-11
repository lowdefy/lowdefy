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

test('PluginError stores received value for logger formatting', () => {
  const original = new Error('Invalid params');
  const error = new PluginError({
    error: original,
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
  const error = new PluginError({
    error: original,
    received: circular,
  });
  // Message does NOT include received - logger handles formatting
  expect(error.message).toBe('Invalid params');
  expect(error.received).toBe(circular);
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
  // Message includes location but NOT received - logger formats received
  expect(error.message).toBe('_if requires boolean test at blocks.0.visible.');
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

test('PluginError serialize includes stack trace', () => {
  const original = new Error('Test error');
  const error = new PluginError({
    error: original,
    pluginType: 'operator',
    pluginName: '_if',
    configKey: 'key123',
  });
  const serialized = error.serialize();

  expect(serialized['~err']).toBe('PluginError');
  expect(serialized.message).toBe('Test error');
  expect(serialized.pluginType).toBe('operator');
  expect(serialized.pluginName).toBe('_if');
  expect(serialized.configKey).toBe('key123');
  expect(serialized.stack).toBe(original.stack);
  expect(serialized.stack).toContain('PluginError.test.js');
});

test('PluginError deserialize restores error with stack trace', () => {
  const original = new Error('Original error');
  const pluginError = new PluginError({
    error: original,
    pluginType: 'action',
    pluginName: 'SetState',
    location: 'events.onClick',
    configKey: 'key456',
  });
  const serialized = pluginError.serialize();
  const restored = PluginError.deserialize(serialized);

  expect(restored.name).toBe('PluginError');
  expect(restored.message).toBe(pluginError.message);
  expect(restored.pluginType).toBe('action');
  expect(restored.pluginName).toBe('SetState');
  expect(restored.location).toBe('events.onClick');
  expect(restored.configKey).toBe('key456');
  expect(restored.stack).toBe(original.stack);
  expect(restored.stack).toContain('PluginError.test.js');
});

test('PluginError serialize/deserialize roundtrip preserves stack', () => {
  const original = new Error('Roundtrip test');
  const pluginError = new PluginError({
    error: original,
    pluginType: 'request',
    pluginName: 'MongoDBFind',
  });
  const json = JSON.stringify(pluginError.serialize());
  const parsed = JSON.parse(json);
  const restored = PluginError.deserialize(parsed);

  expect(restored.message).toBe(pluginError.message);
  expect(restored.stack).toBe(original.stack);
});

test('PluginError deserialize handles missing stack', () => {
  const data = {
    '~err': 'PluginError',
    message: 'No stack error',
    pluginType: 'block',
    pluginName: 'Button',
  };
  const error = PluginError.deserialize(data);

  expect(error.name).toBe('PluginError');
  expect(error.message).toBe('No stack error');
  expect(error.pluginType).toBe('block');
  // Will have its own stack from construction
  expect(error.stack).toContain('Error');
});

test('PluginError serialize includes received for operator pluginType', () => {
  const original = new Error('_if requires boolean test.');
  const error = new PluginError({
    error: original,
    pluginType: 'operator',
    pluginName: '_if',
    received: { _if: { test: 'not_boolean' } },
    configKey: 'key789',
  });
  const serialized = error.serialize();

  expect(serialized['~err']).toBe('PluginError');
  expect(serialized.pluginType).toBe('operator');
  expect(serialized.pluginName).toBe('_if');
  expect(serialized.received).toEqual({ _if: { test: 'not_boolean' } });
  expect(serialized.configKey).toBe('key789');
  // Should not include block-specific fields
  expect(serialized.blockType).toBeUndefined();
  expect(serialized.properties).toBeUndefined();
});
