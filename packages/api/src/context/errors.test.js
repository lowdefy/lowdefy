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

import { ConfigurationError, RequestError, ServerError } from './errors.js';

describe('ConfigurationError', () => {
  test('creates error with message only', () => {
    const error = new ConfigurationError('Test message');
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('ConfigurationError');
    expect(error.configKey).toBeUndefined();
  });

  test('creates error with message and configKey', () => {
    const error = new ConfigurationError('Test message', { configKey: 'test-key' });
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('ConfigurationError');
    expect(error.configKey).toBe('test-key');
  });

  test('creates error with empty options', () => {
    const error = new ConfigurationError('Test message', {});
    expect(error.message).toBe('Test message');
    expect(error.configKey).toBeUndefined();
  });

  test('is instance of Error', () => {
    const error = new ConfigurationError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConfigurationError);
  });
});

describe('RequestError', () => {
  test('creates error with message only', () => {
    const error = new RequestError('Test message');
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('RequestError');
    expect(error.configKey).toBeUndefined();
  });

  test('creates error with message and configKey', () => {
    const error = new RequestError('Test message', { configKey: 'request-key' });
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('RequestError');
    expect(error.configKey).toBe('request-key');
  });

  test('is instance of Error', () => {
    const error = new RequestError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(RequestError);
  });
});

describe('ServerError', () => {
  test('creates error with message only', () => {
    const error = new ServerError('Test message');
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('ServerError');
    expect(error.configKey).toBeUndefined();
  });

  test('creates error with message and configKey', () => {
    const error = new ServerError('Test message', { configKey: 'server-key' });
    expect(error.message).toBe('Test message');
    expect(error.name).toBe('ServerError');
    expect(error.configKey).toBe('server-key');
  });

  test('is instance of Error', () => {
    const error = new ServerError('Test message');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ServerError);
  });
});
