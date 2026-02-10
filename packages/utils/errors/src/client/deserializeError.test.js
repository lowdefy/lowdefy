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
import PluginError from '../PluginError.js';
import ServiceError from '../ServiceError.js';

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

test('deserializeError creates client ConfigError with resolve method', () => {
  const data = {
    '~err': 'ConfigError',
    message: 'Test',
    configKey: 'k',
  };
  const error = deserializeError(data);

  expect(typeof error.resolve).toBe('function');
  expect(typeof error.log).toBe('function');
});

test('deserializeError creates LowdefyError from serialized data', () => {
  const data = {
    '~err': 'LowdefyError',
    message: 'Unexpected condition',
  };
  const error = deserializeError(data);

  expect(error instanceof LowdefyError).toBe(true);
  expect(error.message).toBe('Unexpected condition');
});

test('deserializeError creates PluginError from serialized data', () => {
  const data = {
    '~err': 'PluginError',
    message: '_if requires boolean test',
    pluginType: 'operator',
    pluginName: '_if',
    configKey: 'key123',
  };
  const error = deserializeError(data);

  expect(error instanceof PluginError).toBe(true);
  expect(error.message).toBe('_if requires boolean test');
  expect(error.pluginType).toBe('operator');
  expect(error.pluginName).toBe('_if');
});

test('deserializeError creates ServiceError from serialized data', () => {
  const data = {
    '~err': 'ServiceError',
    message: 'MongoDB: Connection refused',
    service: 'MongoDB',
    code: 'ECONNREFUSED',
    statusCode: undefined,
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
