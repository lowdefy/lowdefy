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
import { ensureMcpOauthResource } from './oauthResourceLifecycle.js';

const resourceUri = 'https://app.example.com/api/mcp';

function createMockAuth({ resources = [] } = {}) {
  const rows = new Map(resources.map((row) => [row.identifier, { ...row }]));
  const adapter = {
    findOne: jest.fn(async ({ model, where }) => {
      if (model === 'oauthResource') {
        return rows.get(where[0].value) ?? null;
      }
      throw new Error(`Unexpected findOne model ${model}.`);
    }),
    create: jest.fn(async ({ data }) => {
      rows.set(data.identifier, { ...data });
      return { ...data };
    }),
    update: jest.fn(),
  };
  const auth = { $context: Promise.resolve({ adapter }) };
  return { auth, adapter, rows };
}

function createMockLogger() {
  return { warn: jest.fn() };
}

test('ensureMcpOauthResource is a no-op when no MCP resource binding is registered', async () => {
  const { auth, adapter } = createMockAuth();
  const logger = createMockLogger();

  await ensureMcpOauthResource({ auth, logger });

  expect(adapter.findOne).not.toHaveBeenCalled();
  expect(adapter.create).not.toHaveBeenCalled();
  expect(logger.warn).not.toHaveBeenCalled();
});

test('ensureMcpOauthResource inserts one enabled row identified by the resource URI', async () => {
  const { auth, adapter } = createMockAuth();
  registerMcpResourceBinding({ auth, resourceUri });
  const logger = createMockLogger();

  await ensureMcpOauthResource({ auth, logger });

  expect(adapter.create).toHaveBeenCalledWith({
    model: 'oauthResource',
    data: {
      identifier: resourceUri,
      name: resourceUri,
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

test('ensureMcpOauthResource never reverts an existing row, disabled rows included', async () => {
  const { auth, adapter } = createMockAuth({
    resources: [{ identifier: resourceUri, disabled: true }],
  });
  registerMcpResourceBinding({ auth, resourceUri });
  const logger = createMockLogger();

  await ensureMcpOauthResource({ auth, logger });

  expect(adapter.create).not.toHaveBeenCalled();
  expect(adapter.update).not.toHaveBeenCalled();
});

test('ensureMcpOauthResource treats a lost unique-index race as the row existing', async () => {
  const { auth, adapter } = createMockAuth();
  registerMcpResourceBinding({ auth, resourceUri });
  const logger = createMockLogger();
  adapter.findOne
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ identifier: resourceUri, disabled: false });
  adapter.create.mockRejectedValueOnce(new Error('E11000 duplicate key error: identifier'));

  await ensureMcpOauthResource({ auth, logger });

  expect(logger.warn).not.toHaveBeenCalled();
});

test('ensureMcpOauthResource runs once per auth instance', async () => {
  const { auth, adapter } = createMockAuth();
  registerMcpResourceBinding({ auth, resourceUri });
  const logger = createMockLogger();

  await ensureMcpOauthResource({ auth, logger });
  await ensureMcpOauthResource({ auth, logger });

  expect(adapter.findOne).toHaveBeenCalledTimes(1);
  expect(adapter.create).toHaveBeenCalledTimes(1);
});

test('ensureMcpOauthResource logs a failure without memoizing it and retries on the next call', async () => {
  const { auth, adapter } = createMockAuth();
  registerMcpResourceBinding({ auth, resourceUri });
  const logger = createMockLogger();
  adapter.findOne.mockRejectedValueOnce(new Error('connection refused'));

  await ensureMcpOauthResource({ auth, logger });
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][1]).toEqual(
    `Failed to ensure the oauthResource row "${resourceUri}" for the MCP resource.`
  );

  await ensureMcpOauthResource({ auth, logger });
  expect(adapter.create).toHaveBeenCalledTimes(1);
  expect(logger.warn).toHaveBeenCalledTimes(1);
});
