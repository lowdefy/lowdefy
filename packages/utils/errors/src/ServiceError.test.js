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

import ServiceError from './ServiceError.js';

test('ServiceError creates error with message only', () => {
  const error = new ServiceError({ message: 'Connection failed' });
  expect(error.message).toBe('Connection failed');
  expect(error.name).toBe('ServiceError');
  expect(error.configKey).toBeNull();
});

test('ServiceError includes service name in message', () => {
  const error = new ServiceError({ message: 'Connection refused', service: 'MongoDB' });
  expect(error.message).toBe('MongoDB: Connection refused');
  expect(error.service).toBe('MongoDB');
});

test('ServiceError stores error code', () => {
  const error = new ServiceError({ message: 'Failed', code: 'ECONNREFUSED' });
  expect(error.code).toBe('ECONNREFUSED');
});

test('ServiceError stores status code', () => {
  const error = new ServiceError({ message: 'Server error', statusCode: 503 });
  expect(error.statusCode).toBe(503);
});

test('ServiceError is an instance of Error', () => {
  const error = new ServiceError({ message: 'Test' });
  expect(error instanceof Error).toBe(true);
  expect(error instanceof ServiceError).toBe(true);
});

describe('ServiceError.isServiceError', () => {
  test('returns false for null/undefined', () => {
    expect(ServiceError.isServiceError(null)).toBe(false);
    expect(ServiceError.isServiceError(undefined)).toBe(false);
  });

  test('returns true for ECONNREFUSED', () => {
    const error = new Error('connect ECONNREFUSED');
    error.code = 'ECONNREFUSED';
    expect(ServiceError.isServiceError(error)).toBe(true);
  });

  test('returns true for ENOTFOUND', () => {
    const error = new Error('getaddrinfo ENOTFOUND');
    error.code = 'ENOTFOUND';
    expect(ServiceError.isServiceError(error)).toBe(true);
  });

  test('returns true for ETIMEDOUT', () => {
    const error = new Error('connect ETIMEDOUT');
    error.code = 'ETIMEDOUT';
    expect(ServiceError.isServiceError(error)).toBe(true);
  });

  test('returns true for ECONNRESET', () => {
    const error = new Error('socket hang up');
    error.code = 'ECONNRESET';
    expect(ServiceError.isServiceError(error)).toBe(true);
  });

  test('returns true for 5xx status codes', () => {
    const error = new Error('Internal Server Error');
    error.statusCode = 500;
    expect(ServiceError.isServiceError(error)).toBe(true);

    error.statusCode = 503;
    expect(ServiceError.isServiceError(error)).toBe(true);

    error.statusCode = 599;
    expect(ServiceError.isServiceError(error)).toBe(true);
  });

  test('returns true for status in response object', () => {
    const error = new Error('Server Error');
    error.response = { status: 502 };
    expect(ServiceError.isServiceError(error)).toBe(true);
  });

  test('returns false for 4xx status codes', () => {
    const error = new Error('Not Found');
    error.statusCode = 404;
    expect(ServiceError.isServiceError(error)).toBe(false);
  });

  test('returns true for network error messages', () => {
    expect(ServiceError.isServiceError(new Error('network error'))).toBe(true);
    expect(ServiceError.isServiceError(new Error('Request timeout exceeded'))).toBe(true);
    expect(ServiceError.isServiceError(new Error('Connection refused by server'))).toBe(true);
    expect(ServiceError.isServiceError(new Error('DNS lookup failed'))).toBe(true);
    expect(ServiceError.isServiceError(new Error('socket hang up'))).toBe(true);
    expect(ServiceError.isServiceError(new Error('certificate has expired'))).toBe(true);
    expect(ServiceError.isServiceError(new Error('service unavailable'))).toBe(true);
  });

  test('returns false for regular errors', () => {
    expect(ServiceError.isServiceError(new Error('Invalid parameter'))).toBe(false);
    expect(ServiceError.isServiceError(new Error('undefined is not a function'))).toBe(false);
  });
});

describe('ServiceError constructor with error parameter', () => {
  test('creates ServiceError from existing error', () => {
    const original = new Error('connect ECONNREFUSED 127.0.0.1:27017');
    original.code = 'ECONNREFUSED';

    const serviceError = new ServiceError({ error: original, service: 'MongoDB' });

    expect(serviceError.name).toBe('ServiceError');
    expect(serviceError.service).toBe('MongoDB');
    expect(serviceError.code).toBe('ECONNREFUSED');
    expect(serviceError.cause).toBe(original);
    expect(serviceError.message).toContain('MongoDB:');
    expect(serviceError.message).toContain('Connection refused');
  });

  test('creates ServiceError without service name', () => {
    const original = new Error('timeout');
    const serviceError = new ServiceError({ error: original });

    expect(serviceError.message).toBe('timeout');
    expect(serviceError.service).toBeUndefined();
  });

  test('preserves status code from original', () => {
    const original = new Error('Internal Server Error');
    original.statusCode = 500;

    const serviceError = new ServiceError({ error: original, service: 'API' });
    expect(serviceError.statusCode).toBe(500);
    expect(serviceError.message).toContain('Server returned error 500');
  });

  test('stores configKey when provided', () => {
    const original = new Error('connect ECONNREFUSED');
    original.code = 'ECONNREFUSED';

    const serviceError = new ServiceError({
      error: original,
      service: 'MongoDB',
      configKey: 'requests.0.connection',
    });
    expect(serviceError.configKey).toBe('requests.0.connection');
  });

  test('configKey is null when not provided', () => {
    const original = new Error('timeout');
    const serviceError = new ServiceError({ error: original, service: 'API' });
    expect(serviceError.configKey).toBeNull();
  });
});

test('ServiceError stores raw base message in _message', () => {
  const original = new Error('connect ECONNREFUSED 127.0.0.1:27017');
  original.code = 'ECONNREFUSED';
  const error = new ServiceError({ error: original, service: 'MongoDB' });

  // _message stores the enhanced message before service prefix
  expect(error._message).toContain('Connection refused');
  // message includes service prefix
  expect(error.message).toContain('MongoDB:');
});

test('ServiceError stores base message in _message without service', () => {
  const error = new ServiceError({ message: 'Connection failed' });
  expect(error._message).toBe('Connection failed');
});

describe('ServiceError.enhanceMessage', () => {
  test('enhances ECONNREFUSED message', () => {
    const error = new Error('connect ECONNREFUSED');
    error.code = 'ECONNREFUSED';

    const enhanced = ServiceError.enhanceMessage(error);
    expect(enhanced).toContain('Connection refused');
    expect(enhanced).toContain('service may be down');
  });

  test('enhances ENOTFOUND message', () => {
    const error = new Error('getaddrinfo ENOTFOUND');
    error.code = 'ENOTFOUND';

    const enhanced = ServiceError.enhanceMessage(error);
    expect(enhanced).toContain('DNS lookup failed');
  });

  test('enhances ETIMEDOUT message', () => {
    const error = new Error('connect ETIMEDOUT');
    error.code = 'ETIMEDOUT';

    const enhanced = ServiceError.enhanceMessage(error);
    expect(enhanced).toContain('timed out');
  });

  test('enhances ECONNRESET message', () => {
    const error = new Error('socket hang up');
    error.code = 'ECONNRESET';

    const enhanced = ServiceError.enhanceMessage(error);
    expect(enhanced).toContain('Connection reset');
  });

  test('enhances 5xx status code message', () => {
    const error = new Error('Bad Gateway');
    error.statusCode = 502;

    const enhanced = ServiceError.enhanceMessage(error);
    expect(enhanced).toContain('Server returned error 502');
  });

  test('returns original message for unknown errors', () => {
    const error = new Error('Unknown error');
    const enhanced = ServiceError.enhanceMessage(error);
    expect(enhanced).toBe('Unknown error');
  });
});
