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

jest.unstable_mockModule('../../docs/serverErrorStore.js', () => ({
  default: { push: jest.fn(), list: jest.fn(() => []) },
}));

const { default: serverErrorStore } = await import('../../docs/serverErrorStore.js');
const { default: createHandleError } = await import('./createHandleError.js');

// This sink is the sole writer of `error.handled`. Two callers read the flag and
// neither can set it for itself: runRoutine's catch guards on `!error.handled` to
// avoid logging a nested error twice, and the browser's handleError skips the
// round-trip to /api/client-error when it is set. runRoutine deliberately gave up
// its own assignment on the strength of this function, so the tests below pin the
// assignment and — more importantly — its position ahead of everything that can
// throw.

const keyMap = { key_1: { key: 'root.pages[0:home]', '~r': 'ref_1', '~l': 5 } };
const refMap = { ref_1: { path: 'pages/home.yaml' } };

function testContext({ logger, readConfigFile, configDirectory } = {}) {
  return {
    configDirectory,
    logger: logger ?? { error: jest.fn() },
    readConfigFile:
      readConfigFile ??
      jest.fn(async (path) => {
        if (path === 'keyMap.json') return keyMap;
        if (path === 'refMap.json') return refMap;
        return null;
      }),
  };
}

beforeEach(() => {
  console.error = jest.fn();
  serverErrorStore.push.mockReset();
});

test('handleError marks the error handled and resolves its location', async () => {
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new ConfigError('Bad config.', { configKey: 'key_1' });

  await handleError(error);

  expect(error.handled).toBe(true);
  expect(error.source).toBe('pages/home.yaml:5');
  expect(error.config).toBe('root.pages[0:home]');
  expect(context.logger.error).toHaveBeenCalledWith(error);
});

test('handleError marks a LowdefyInternalError handled even though it never gets a source', async () => {
  // The Decision 7 case. Location resolution is deliberately skipped for an
  // internal error, so `source` stays undefined - which is why the client's
  // already-logged gate reads `handled` and not `source`. Keyed on source, this
  // error was POSTed back to /api/client-error and logged a second time.
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new LowdefyInternalError('Unexpected condition.');

  await handleError(error);

  expect(error.handled).toBe(true);
  expect(error.source).toBeUndefined();
  expect(context.readConfigFile).not.toHaveBeenCalled();
  expect(context.logger.error).toHaveBeenCalledWith(error);
});

test('handleError marks the error handled before it logs, so a throwing logger cannot skip the flag', async () => {
  const logger = {
    error: jest.fn(() => {
      throw new Error('Log drain unreachable.');
    }),
  };
  const context = testContext({ logger });
  const handleError = createHandleError({ context });
  const error = new ConfigError('Bad config.', { configKey: 'key_1' });

  await handleError(error);

  // The sink swallows its own failure - reaching it is what makes the error
  // already-logged, so the flag must survive the log call failing. Were it set
  // after the log, this error would cross the wire unflagged and be logged a
  // second time from the browser.
  expect(error.handled).toBe(true);
  expect(logger.error).toHaveBeenCalled();
  expect(console.error).toHaveBeenCalled();
});

test('handleError marks the error handled when location resolution rejects', async () => {
  const readConfigFile = jest.fn(async () => {
    throw new Error('keyMap.json unreadable.');
  });
  const context = testContext({ readConfigFile });
  const handleError = createHandleError({ context });
  const error = new ConfigError('Bad config.', { configKey: 'key_1' });

  await handleError(error);

  expect(error.handled).toBe(true);
  // ConfigError's constructor initialises source to null; resolution failing
  // leaves it there rather than assigning.
  expect(error.source).toBeNull();
});

test('handleError marks a plain Error handled', async () => {
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new Error('Something broke.');

  await handleError(error);

  expect(error.handled).toBe(true);
});

test('handleError pushes an error with a configKey into the server error store with its source', async () => {
  const context = testContext();
  context.endpointId = 'get-customer';
  context.pageId = '_mcp';
  const handleError = createHandleError({ context });
  const error = new ConfigError('Bad config.', { configKey: 'key_1' });

  await handleError(error);

  expect(serverErrorStore.push).toHaveBeenCalledTimes(1);
  const entry = serverErrorStore.push.mock.calls[0][0];
  expect(entry).toEqual({
    timestamp: expect.any(String),
    name: 'ConfigError',
    message: 'Bad config.',
    source: 'pages/home.yaml:5',
    config: 'root.pages[0:home]',
    hint: null,
    endpointId: 'get-customer',
    requestId: null,
    pageId: '_mcp',
  });
  // Pushed before the log so a throwing logger cannot lose the entry.
  expect(serverErrorStore.push.mock.invocationCallOrder[0]).toBeLessThan(
    context.logger.error.mock.invocationCallOrder[0]
  );
});

test('handleError does not push a UserError into the server error store', async () => {
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new UserError('Rejected.');

  await handleError(error);

  expect(error.handled).toBe(true);
  expect(serverErrorStore.push).not.toHaveBeenCalled();
  expect(context.logger.error).toHaveBeenCalledWith(error);
});

test('handleError does not push a LowdefyInternalError into the server error store', async () => {
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new LowdefyInternalError('Unexpected condition.');

  await handleError(error);

  expect(serverErrorStore.push).not.toHaveBeenCalled();
  expect(context.logger.error).toHaveBeenCalledWith(error);
});

test('handleError still logs when the server error store throws', async () => {
  serverErrorStore.push.mockImplementation(() => {
    throw new Error('Store full.');
  });
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new ConfigError('Bad config.', { configKey: 'key_1' });

  await handleError(error);

  expect(error.handled).toBe(true);
  expect(console.error).toHaveBeenCalledWith(error);
  expect(console.error).toHaveBeenCalledWith('An error occurred while logging the error.');
});
