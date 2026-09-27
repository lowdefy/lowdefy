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
import { ConfigError, ServiceError } from '@lowdefy/errors';

import ensureAuthIndexes from './ensureAuthIndexes.js';

function createAuth(options) {
  return { $context: Promise.resolve({ adapter: { id: 'test-adapter', options } }) };
}

test('ensureAuthIndexes asks the adapter once per auth instance', async () => {
  const ensureUniqueIndexes = jest.fn(async () => {});
  const auth = createAuth({ ensureUniqueIndexes });
  const logger = { error: jest.fn(), warn: jest.fn() };
  await ensureAuthIndexes({ auth, logger });
  await ensureAuthIndexes({ auth, logger });
  expect(ensureUniqueIndexes).toHaveBeenCalledTimes(1);
});

test('ensureAuthIndexes refuses at once during the cool-down after a failure and retries after it', async () => {
  const now = jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-01-01T00:00:00Z'));
  try {
    const ensureUniqueIndexes = jest
      .fn()
      .mockRejectedValueOnce(new Error('duplicate key'))
      .mockResolvedValueOnce();
    const auth = createAuth({ ensureUniqueIndexes });
    const logger = { error: jest.fn(), warn: jest.fn() };
    await expect(ensureAuthIndexes({ auth, logger })).rejects.toThrow(ConfigError);
    await expect(ensureAuthIndexes({ auth, logger })).rejects.toThrow(ConfigError);
    expect(ensureUniqueIndexes).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
    now.mockReturnValue(Date.parse('2026-01-01T00:00:31Z'));
    await ensureAuthIndexes({ auth, logger });
    await ensureAuthIndexes({ auth, logger });
    expect(ensureUniqueIndexes).toHaveBeenCalledTimes(2);
  } finally {
    now.mockRestore();
  }
});

test('ensureAuthIndexes reports an unreachable database as a service error', async () => {
  const outage = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
  const auth = createAuth({ ensureUniqueIndexes: jest.fn().mockRejectedValue(outage) });
  await expect(
    ensureAuthIndexes({ auth, logger: { error: jest.fn(), warn: jest.fn() } })
  ).rejects.toThrow(ServiceError);
});

test('ensureAuthIndexes warns once when the adapter can not create indexes', async () => {
  const auth = createAuth({ adapterConfig: {} });
  const logger = { error: jest.fn(), warn: jest.fn() };
  await ensureAuthIndexes({ auth, logger });
  await ensureAuthIndexes({ auth, logger });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toContain(
    'Auth database adapter "test-adapter" can not create indexes.'
  );
});
