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

import { jest } from '@jest/globals';
import { ConfigError, LowdefyInternalError, UserError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import createHandleError from './createHandleError.js';

let fetchMock;

function createLowdefy({ basePath } = {}) {
  return {
    _internal: { logger: { error: jest.fn() } },
    _runtimeErrorCallback: jest.fn(),
    basePath,
  };
}

function mockResponse(body = {}) {
  return { ok: true, json: async () => body };
}

beforeEach(() => {
  fetchMock = jest.fn().mockResolvedValue(mockResponse());
  globalThis.fetch = fetchMock;
});

afterEach(() => {
  delete globalThis.fetch;
});

test('handleError does not POST a LowdefyInternalError that was already handled server-side (regression: internal errors were logged twice)', async () => {
  const lowdefy = createLowdefy();
  const handleError = createHandleError(lowdefy);
  const error = new LowdefyInternalError('Unexpected condition in engine.');
  // The servers' createHandleError sets `handled` where the error is logged, but
  // deliberately skips location resolution for internal errors, so there is no source.
  error.handled = true;

  await handleError(error);

  expect(fetchMock).not.toHaveBeenCalled();
  expect(lowdefy._internal.logger.error).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.logger.error).toHaveBeenCalledWith(error);
  expect(lowdefy._runtimeErrorCallback).toHaveBeenCalledWith(error);
});

test('handleError logs a handled Lowdefy error locally without POSTing it to the server', async () => {
  const lowdefy = createLowdefy();
  const handleError = createHandleError(lowdefy);
  const error = new ConfigError('Block type "Buton" not found.', { configKey: 'block:1' });
  error.handled = true;
  error.source = 'pages/home.yaml:12';

  await handleError(error);

  expect(fetchMock).not.toHaveBeenCalled();
  expect(lowdefy._internal.logger.error).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.logger.error).toHaveBeenCalledWith(error);
});

test('handleError POSTs a client-originated Lowdefy error to /api/client-error and assigns the resolved source', async () => {
  const lowdefy = createLowdefy();
  const handleError = createHandleError(lowdefy);
  fetchMock.mockResolvedValue(mockResponse({ source: 'pages/home.yaml:42' }));
  const error = new ConfigError('Operator _get failed.', { configKey: 'op:7' });

  await handleError(error);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/client-error');
  expect(options.method).toBe('POST');
  expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
  expect(options.credentials).toBe('same-origin');
  const body = JSON.parse(options.body);
  expect(body['~e'].message).toBe('Operator _get failed.');
  expect(body['~e'].configKey).toBe('op:7');

  expect(error.source).toBe('pages/home.yaml:42');
  expect(lowdefy._internal.logger.error).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.logger.error).toHaveBeenCalledWith(error);
});

test('handleError logs the configError returned by the server instead of the original error', async () => {
  const lowdefy = createLowdefy();
  const handleError = createHandleError(lowdefy);
  const configError = new ConfigError('Consolidated config error.', { configKey: 'op:7' });
  configError.source = 'pages/home.yaml:42';
  fetchMock.mockResolvedValue(
    mockResponse({ source: 'pages/home.yaml:42', configError: serializer.serialize(configError) })
  );
  const error = new ConfigError('Operator _get failed.', { configKey: 'op:7' });

  await handleError(error);

  expect(lowdefy._internal.logger.error).toHaveBeenCalledTimes(1);
  const logged = lowdefy._internal.logger.error.mock.calls[0][0];
  expect(logged).not.toBe(error);
  expect(logged.name).toBe('ConfigError');
  expect(logged.message).toBe('Consolidated config error.');
  expect(logged.source).toBe('pages/home.yaml:42');
});

test('handleError logs a UserError to the console and never sends it to the server', async () => {
  const lowdefy = createLowdefy();
  const handleError = createHandleError(lowdefy);
  const error = new UserError('Please enter a valid email address.', {
    blockId: 'email',
    pageId: 'home',
  });

  await handleError(error);

  expect(fetchMock).not.toHaveBeenCalled();
  expect(lowdefy._internal.logger.error).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.logger.error).toHaveBeenCalledWith(error);
  expect(lowdefy._runtimeErrorCallback).not.toHaveBeenCalled();
});

test('handleError logs a plain non-Lowdefy error locally only', async () => {
  const lowdefy = createLowdefy();
  const handleError = createHandleError(lowdefy);
  const error = new TypeError('x is not a function');

  await handleError(error);

  expect(fetchMock).not.toHaveBeenCalled();
  expect(lowdefy._internal.logger.error).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.logger.error).toHaveBeenCalledWith(error);
});

test('handleError logs an error with the same message and configKey only once', async () => {
  const lowdefy = createLowdefy();
  const handleError = createHandleError(lowdefy);
  const first = new ConfigError('Duplicate message.', { configKey: 'block:1' });
  first.handled = true;
  const second = new ConfigError('Duplicate message.', { configKey: 'block:1' });
  second.handled = true;

  await handleError(first);
  await handleError(second);

  expect(lowdefy._internal.logger.error).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.logger.error).toHaveBeenCalledWith(first);
});

test('handleError logs both errors when the message is the same but the configKey differs', async () => {
  const lowdefy = createLowdefy();
  const handleError = createHandleError(lowdefy);
  const first = new ConfigError('Duplicate message.', { configKey: 'block:1' });
  first.handled = true;
  const second = new ConfigError('Duplicate message.', { configKey: 'block:2' });
  second.handled = true;

  await handleError(first);
  await handleError(second);

  expect(lowdefy._internal.logger.error).toHaveBeenCalledTimes(2);
  expect(lowdefy._internal.logger.error).toHaveBeenNthCalledWith(1, first);
  expect(lowdefy._internal.logger.error).toHaveBeenNthCalledWith(2, second);
});

test('handleError prefixes the client-error request with lowdefy.basePath', async () => {
  const lowdefy = createLowdefy({ basePath: '/my-app' });
  const handleError = createHandleError(lowdefy);
  const error = new ConfigError('Operator _get failed.', { configKey: 'op:7' });

  await handleError(error);

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe('/my-app/api/client-error');
});
