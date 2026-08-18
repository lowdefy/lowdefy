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

import { registerMcpResourceBinding } from './getMcpResourceBinding.js';
import {
  disableOauthResourceRow,
  ensureOauthResourceRow,
  reconcileOauthResources,
} from './oauthResourceLifecycle.js';

const uriPrefix = 'https://app.example.com/api/mcp/';

function createMockAuth({ organizations = [], resources = [] } = {}) {
  const rows = new Map(resources.map((row) => [row.identifier, { ...row }]));
  const adapter = {
    findOne: jest.fn(async ({ model, where }) => {
      if (model === 'oauthResource') {
        return rows.get(where[0].value) ?? null;
      }
      throw new Error(`Unexpected findOne model ${model}.`);
    }),
    findMany: jest.fn(async ({ model, limit, offset }) => {
      if (model === 'organization') {
        return organizations.slice(offset ?? 0, (offset ?? 0) + limit);
      }
      throw new Error(`Unexpected findMany model ${model}.`);
    }),
    create: jest.fn(async ({ data }) => {
      rows.set(data.identifier, { ...data });
      return { ...data };
    }),
    update: jest.fn(async ({ where, update }) => {
      const row = rows.get(where[0].value);
      if (!row) {
        return null;
      }
      Object.assign(row, update);
      return row;
    }),
  };
  const auth = { $context: Promise.resolve({ adapter }) };
  return { auth, adapter, rows };
}

function createMockLogger() {
  return { warn: jest.fn() };
}

test('ensureOauthResourceRow is a no-op when no MCP resource binding is registered', async () => {
  const { auth, adapter } = createMockAuth();
  const logger = createMockLogger();

  await ensureOauthResourceRow({ auth, logger, organizationId: 'org-1' });

  expect(adapter.findOne).not.toHaveBeenCalled();
  expect(adapter.create).not.toHaveBeenCalled();
  expect(logger.warn).not.toHaveBeenCalled();
});

test('ensureOauthResourceRow inserts an enabled row identified by the prefixed org id', async () => {
  const { auth, adapter } = createMockAuth();
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();

  await ensureOauthResourceRow({ auth, logger, organizationId: 'org-1' });

  expect(adapter.create).toHaveBeenCalledWith({
    model: 'oauthResource',
    data: {
      identifier: `${uriPrefix}org-1`,
      name: `${uriPrefix}org-1`,
      accessTokenTtl: null,
      refreshTokenTtl: null,
      signingAlgorithm: null,
      signingKeyId: null,
      allowedScopes: null,
      customClaims: null,
      dpopBoundAccessTokensRequired: false,
      disabled: false,
      policyVersion: 1,
      metadata: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    },
  });
  expect(logger.warn).not.toHaveBeenCalled();
});

test('ensureOauthResourceRow never reverts an existing row, disabled rows included', async () => {
  const { auth, adapter } = createMockAuth({
    resources: [{ identifier: `${uriPrefix}org-1`, disabled: true }],
  });
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();

  await ensureOauthResourceRow({ auth, logger, organizationId: 'org-1' });

  expect(adapter.create).not.toHaveBeenCalled();
  expect(adapter.update).not.toHaveBeenCalled();
});

test('ensureOauthResourceRow treats a lost unique-index race as the row existing', async () => {
  const { auth, adapter } = createMockAuth();
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();
  adapter.findOne
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ identifier: `${uriPrefix}org-1`, disabled: false });
  adapter.create.mockRejectedValueOnce(new Error('E11000 duplicate key error: identifier'));

  await ensureOauthResourceRow({ auth, logger, organizationId: 'org-1' });

  expect(logger.warn).not.toHaveBeenCalled();
});

test('ensureOauthResourceRow logs and continues when the adapter fails', async () => {
  const { auth, adapter } = createMockAuth();
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();
  adapter.findOne.mockRejectedValueOnce(new Error('connection refused'));

  await expect(
    ensureOauthResourceRow({ auth, logger, organizationId: 'org-1' })
  ).resolves.toBeUndefined();

  expect(logger.warn).toHaveBeenCalledWith(
    { err: expect.any(Error) },
    `Failed to ensure the oauthResource row "${uriPrefix}org-1" for organization "org-1".`
  );
});

test('disableOauthResourceRow marks the org row disabled', async () => {
  const { auth, adapter, rows } = createMockAuth({
    resources: [{ identifier: `${uriPrefix}org-1`, disabled: false }],
  });
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();

  await disableOauthResourceRow({ auth, logger, organizationId: 'org-1' });

  expect(adapter.update).toHaveBeenCalledWith({
    model: 'oauthResource',
    where: [{ field: 'identifier', value: `${uriPrefix}org-1` }],
    update: { disabled: true, updatedAt: expect.any(Date) },
  });
  expect(rows.get(`${uriPrefix}org-1`).disabled).toBe(true);
});

test('disableOauthResourceRow is a no-op when no MCP resource binding is registered', async () => {
  const { auth, adapter } = createMockAuth({
    resources: [{ identifier: `${uriPrefix}org-1`, disabled: false }],
  });
  const logger = createMockLogger();

  await disableOauthResourceRow({ auth, logger, organizationId: 'org-1' });

  expect(adapter.update).not.toHaveBeenCalled();
});

test('disableOauthResourceRow logs and continues when the adapter fails', async () => {
  const { auth, adapter } = createMockAuth();
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();
  adapter.update.mockRejectedValueOnce(new Error('connection refused'));

  await expect(
    disableOauthResourceRow({ auth, logger, organizationId: 'org-1' })
  ).resolves.toBeUndefined();

  expect(logger.warn).toHaveBeenCalledWith(
    { err: expect.any(Error) },
    `Failed to disable the oauthResource row "${uriPrefix}org-1" for the deleted organization "org-1".`
  );
});

test('reconcileOauthResources inserts exactly the missing rows and never re-enables a disabled one', async () => {
  const { auth, adapter, rows } = createMockAuth({
    organizations: [{ id: 'org-1' }, { id: 'org-2' }, { id: 'org-3' }],
    resources: [
      { identifier: `${uriPrefix}org-1`, disabled: false },
      { identifier: `${uriPrefix}org-2`, disabled: true },
    ],
  });
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();

  await reconcileOauthResources({ auth, logger });

  expect(adapter.create).toHaveBeenCalledTimes(1);
  expect(adapter.create).toHaveBeenCalledWith({
    model: 'oauthResource',
    data: expect.objectContaining({ identifier: `${uriPrefix}org-3`, disabled: false }),
  });
  expect(rows.get(`${uriPrefix}org-2`).disabled).toBe(true);
  expect(adapter.update).not.toHaveBeenCalled();
});

test('reconcileOauthResources is a no-op when no MCP resource binding is registered', async () => {
  const { auth, adapter } = createMockAuth({ organizations: [{ id: 'org-1' }] });
  const logger = createMockLogger();

  await reconcileOauthResources({ auth, logger });

  expect(adapter.findMany).not.toHaveBeenCalled();
  expect(adapter.create).not.toHaveBeenCalled();
});

test('reconcileOauthResources runs one pass per auth instance', async () => {
  const { auth, adapter } = createMockAuth({ organizations: [{ id: 'org-1' }] });
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();

  await reconcileOauthResources({ auth, logger });
  await reconcileOauthResources({ auth, logger });

  expect(adapter.findMany).toHaveBeenCalledTimes(1);
  expect(adapter.create).toHaveBeenCalledTimes(1);
});

test('reconcileOauthResources pages past the adapter findMany cap', async () => {
  const organizations = Array.from({ length: 101 }, (_, index) => ({ id: `org-${index}` }));
  const { auth, adapter } = createMockAuth({ organizations });
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();

  await reconcileOauthResources({ auth, logger });

  expect(adapter.findMany).toHaveBeenCalledTimes(2);
  expect(adapter.findMany).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ model: 'organization', limit: 100, offset: 0 })
  );
  expect(adapter.findMany).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ model: 'organization', limit: 100, offset: 100 })
  );
  expect(adapter.create).toHaveBeenCalledTimes(101);
});

test('reconcileOauthResources logs a failure without memoizing it and retries on the next call', async () => {
  const { auth, adapter } = createMockAuth({ organizations: [{ id: 'org-1' }] });
  registerMcpResourceBinding({ auth, uriPrefix });
  const logger = createMockLogger();
  adapter.findMany.mockRejectedValueOnce(new Error('connection refused'));

  await expect(reconcileOauthResources({ auth, logger })).resolves.toBeUndefined();
  expect(logger.warn).toHaveBeenCalledWith(
    { err: expect.any(Error) },
    'Failed to reconcile the oauthResource rows for the process.'
  );

  await reconcileOauthResources({ auth, logger });
  expect(adapter.create).toHaveBeenCalledWith({
    model: 'oauthResource',
    data: expect.objectContaining({ identifier: `${uriPrefix}org-1` }),
  });
});
