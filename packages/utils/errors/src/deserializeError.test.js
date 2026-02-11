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

import deserializeError from './deserializeError.js';
import ConfigError from './ConfigError.js';
import LowdefyError from './LowdefyError.js';
import PluginError from './PluginError.js';
import ServiceError from './ServiceError.js';

test('deserializeError creates ConfigError from serialized data', () => {
  const data = {
    '~err': 'ConfigError',
    message: 'Invalid block type',
    configKey: 'abc123',
    source: 'pages/home.yaml:42',
  };
  const error = deserializeError(data);

  expect(error instanceof ConfigError).toBe(true);
  expect(error.message).toBe('Invalid block type');
  expect(error.configKey).toBe('abc123');
  expect(error.source).toBe('pages/home.yaml:42');
});

test('deserializeError creates LowdefyError from serialized data', () => {
  const data = {
    '~err': 'LowdefyError',
    message: 'Unexpected condition',
    stack: 'Error: Unexpected condition\n    at test.js:1',
  };
  const error = deserializeError(data);

  expect(error instanceof LowdefyError).toBe(true);
  expect(error.message).toBe('Unexpected condition');
  expect(error.stack).toBe('Error: Unexpected condition\n    at test.js:1');
});

test('deserializeError creates PluginError from serialized data', () => {
  const data = {
    '~err': 'PluginError',
    message: '_if requires boolean test at blocks.0.visible.',
    rawMessage: '_if requires boolean test',
    pluginType: 'operator',
    pluginName: '_if',
    configKey: 'key123',
    location: 'blocks.0.visible',
    stack: 'Error: test\n    at test.js:1',
  };
  const error = deserializeError(data);

  expect(error instanceof PluginError).toBe(true);
  expect(error.pluginType).toBe('operator');
  expect(error.pluginName).toBe('_if');
  expect(error.location).toBe('blocks.0.visible');
  expect(error.configKey).toBe('key123');
});

test('deserializeError creates ServiceError from serialized data', () => {
  const data = {
    '~err': 'ServiceError',
    message: 'MongoDB: Connection refused',
    service: 'MongoDB',
    code: 'ECONNREFUSED',
  };
  const error = deserializeError(data);

  expect(error instanceof ServiceError).toBe(true);
  expect(error.message).toBe('MongoDB: Connection refused');
  expect(error.service).toBe('MongoDB');
  expect(error.code).toBe('ECONNREFUSED');
});

test('deserializeError throws on unknown error type', () => {
  const data = { '~err': 'UnknownError', message: 'test' };
  expect(() => deserializeError(data)).toThrow('Unknown error type: UnknownError');
});

test('deserializeError throws on missing error type', () => {
  const data = { message: 'test' };
  expect(() => deserializeError(data)).toThrow('Unknown error type: undefined');
});

test('deserializeError roundtrip with ConfigError', () => {
  const original = new ConfigError({ message: 'Test', configKey: 'k1' });
  const serialized = original.serialize();
  const restored = deserializeError(serialized);

  expect(restored instanceof ConfigError).toBe(true);
  expect(restored.message).toBe('Test');
  expect(restored.configKey).toBe('k1');
});

test('deserializeError roundtrip with LowdefyError', () => {
  const original = new LowdefyError('Test error');
  const serialized = original.serialize();
  const restored = deserializeError(serialized);

  expect(restored instanceof LowdefyError).toBe(true);
  expect(restored.message).toBe('Test error');
});

test('deserializeError roundtrip with PluginError', () => {
  const original = new PluginError({
    error: new Error('Plugin failed'),
    pluginType: 'action',
    pluginName: 'SetState',
  });
  const serialized = original.serialize();
  const restored = deserializeError(serialized);

  expect(restored instanceof PluginError).toBe(true);
  expect(restored.pluginType).toBe('action');
  expect(restored.pluginName).toBe('SetState');
});

test('deserializeError roundtrip with ServiceError', () => {
  const original = new ServiceError({
    message: 'Connection refused',
    service: 'MongoDB',
    code: 'ECONNREFUSED',
  });
  const serialized = original.serialize();
  const restored = deserializeError(serialized);

  expect(restored instanceof ServiceError).toBe(true);
  expect(restored.service).toBe('MongoDB');
  expect(restored.code).toBe('ECONNREFUSED');
});
