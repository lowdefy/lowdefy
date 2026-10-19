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

import ensureMcpTokenIndexes from './ensureMcpTokenIndexes.js';

function createAuth(options) {
  return { $context: Promise.resolve({ adapter: { id: 'test-adapter', options } }) };
}

function createLogger() {
  return { error: jest.fn(), warn: jest.fn() };
}

test('ensureMcpTokenIndexes asks the adapter for a unique index on the token hash', async () => {
  const ensureUniqueIndexes = jest.fn(async () => {});
  await ensureMcpTokenIndexes({
    auth: createAuth({ ensureUniqueIndexes }),
    logger: createLogger(),
  });
  expect(ensureUniqueIndexes).toHaveBeenCalledWith({
    indexes: [{ model: 'mcpToken', fields: ['hash'] }],
  });
});

test('ensureMcpTokenIndexes logs a failure and does not throw', async () => {
  const logger = createLogger();
  const auth = createAuth({
    ensureUniqueIndexes: jest.fn().mockRejectedValue(new Error('not authorized')),
  });
  await expect(ensureMcpTokenIndexes({ auth, logger })).resolves.toBeUndefined();
  expect(logger.error).toHaveBeenCalledTimes(1);
});

test('ensureMcpTokenIndexes warns when the adapter can not create indexes', async () => {
  const logger = createLogger();
  await ensureMcpTokenIndexes({ auth: createAuth({}), logger });
  expect(logger.warn).toHaveBeenCalledTimes(1);
});

test('ensureMcpTokenIndexes logs a failed auth context and does not throw', async () => {
  const logger = createLogger();
  const auth = { $context: Promise.reject(new Error('adapter init failed')) };
  await expect(ensureMcpTokenIndexes({ auth, logger })).resolves.toBeUndefined();
  expect(logger.error).toHaveBeenCalledTimes(1);
});
