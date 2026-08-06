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
import { ConfigError } from '@lowdefy/errors';

import resolveTenantPreflight from './resolveTenantPreflight.js';
import testContext from '../../test/testContext.js';

const mockReadConfigFile = jest.fn();
const mockProbe = jest.fn();

const logger = {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

const connections = {
  TestTenantConnection: {
    meta: { tenant: true },
    tenantPreflight: mockProbe,
  },
  NoProbeTenantConnection: {
    meta: { tenant: true },
  },
};

function createTestContext({ organization = { policy: 'tenant' } } = {}) {
  const context = testContext({
    connections,
    organization,
    readConfigFile: mockReadConfigFile,
    user: null,
  });
  context.logger = logger;
  return context;
}

function readConfigImp({
  tenantConnections = [{ connectionId: 'walled', type: 'TestTenantConnection' }],
  connectionConfigs = {
    walled: {
      connectionId: 'walled',
      type: 'TestTenantConnection',
      properties: { databaseUri: 'uri', collection: 'user-contacts' },
    },
  },
} = {}) {
  return (path) => {
    if (path === 'tenantConnections.json') {
      return tenantConnections;
    }
    const match = path.match(/^connections\/(.*)\.json$/);
    if (match) {
      return connectionConfigs[match[1]] ?? null;
    }
    return null;
  };
}

beforeEach(() => {
  mockReadConfigFile.mockReset();
  mockProbe.mockReset();
  logger.info.mockReset();
  logger.warn.mockReset();
});

test('resolves without reading anything under the pinned policy', async () => {
  await resolveTenantPreflight(createTestContext({ organization: { policy: 'pinned' } }));
  expect(mockReadConfigFile).not.toHaveBeenCalled();
});

test('resolves without reading anything when no organization binding resolved', async () => {
  await resolveTenantPreflight(createTestContext({ organization: null }));
  expect(mockReadConfigFile).not.toHaveBeenCalled();
});

test('passes when every walled target is stamped', async () => {
  mockReadConfigFile.mockImplementation(readConfigImp());
  mockProbe.mockResolvedValue({ ok: true });
  await resolveTenantPreflight(createTestContext());
  expect(mockProbe).toHaveBeenCalledTimes(1);
  expect(mockProbe).toHaveBeenCalledWith({
    connection: { databaseUri: 'uri', collection: 'user-contacts' },
    field: 'organization_id',
  });
  expect(logger.info).toHaveBeenCalledWith(
    'Tenant preflight passed - 1 walled target carries no unstamped rows.'
  );
});

test('probes caller-less - connection properties never resolve against the requesting user', async () => {
  mockReadConfigFile.mockImplementation(
    readConfigImp({
      connectionConfigs: {
        walled: {
          connectionId: 'walled',
          type: 'TestTenantConnection',
          properties: { databaseUri: { _user: 'organization_id' }, collection: 'user-contacts' },
        },
      },
    })
  );
  mockProbe.mockResolvedValue({ ok: true });
  const context = createTestContext();
  // The preflight runs on a live request context - after resolveAuthentication -
  // so a caller is present. The memoized verdict must not depend on whoever
  // hits the cold process first, so the caller's identity never reaches the
  // probe's operator evaluation.
  context.user = { id: 'u1', organization_id: 'org_caller' };
  context.operators = {
    _user: ({ user, params }) => user?.[params],
  };
  await resolveTenantPreflight(context);
  expect(mockProbe).toHaveBeenCalledTimes(1);
  const probed = mockProbe.mock.calls[0][0];
  expect(probed.connection.databaseUri).toBeUndefined();
  expect(probed.connection.collection).toEqual('user-contacts');
});

test('refuses with one aggregated error naming every offending target', async () => {
  mockReadConfigFile.mockImplementation(
    readConfigImp({
      tenantConnections: [
        { connectionId: 'contacts-a', type: 'TestTenantConnection' },
        { connectionId: 'contacts-b', type: 'TestTenantConnection' },
        { connectionId: 'companies', type: 'TestTenantConnection' },
      ],
      connectionConfigs: {
        'contacts-a': {
          connectionId: 'contacts-a',
          type: 'TestTenantConnection',
          properties: { databaseUri: 'uri', collection: 'user-contacts' },
        },
        'contacts-b': {
          connectionId: 'contacts-b',
          type: 'TestTenantConnection',
          properties: { databaseUri: 'uri', collection: 'user-contacts' },
        },
        companies: {
          connectionId: 'companies',
          type: 'TestTenantConnection',
          properties: { databaseUri: 'uri', collection: 'companies' },
        },
      },
    })
  );
  mockProbe.mockResolvedValue({ ok: false });
  const context = createTestContext();
  let thrown;
  try {
    await resolveTenantPreflight(context);
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(ConfigError);
  expect(thrown.message).toContain(
    'collection "user-contacts" (connections "contacts-a", "contacts-b")'
  );
  expect(thrown.message).toContain('collection "companies" (connections "companies")');
  expect(thrown.message).toContain('without the tenant field "organization_id"');
  expect(thrown.message).toContain('Backfill the field on the listed collections');
  // Deduped by evaluated target - two contacts connections share one probe.
  expect(mockProbe).toHaveBeenCalledTimes(2);
});

test('probes a custom tenant field', async () => {
  mockReadConfigFile.mockImplementation(
    readConfigImp({
      tenantConnections: [
        {
          connectionId: 'walled',
          type: 'TestTenantConnection',
          tenant: { field: 'tenant_id' },
        },
      ],
    })
  );
  mockProbe.mockResolvedValue({ ok: true });
  await resolveTenantPreflight(createTestContext());
  expect(mockProbe).toHaveBeenCalledWith({
    connection: { databaseUri: 'uri', collection: 'user-contacts' },
    field: 'tenant_id',
  });
});

test('a refusal memoizes - the probe does not run again', async () => {
  mockReadConfigFile.mockImplementation(readConfigImp());
  mockProbe.mockResolvedValue({ ok: false });
  const context = createTestContext();
  await expect(resolveTenantPreflight(context)).rejects.toThrow(ConfigError);
  await expect(resolveTenantPreflight(context)).rejects.toThrow(ConfigError);
  expect(mockProbe).toHaveBeenCalledTimes(1);
});

test('a probe failure does not memoize - the next request retries', async () => {
  mockReadConfigFile.mockImplementation(readConfigImp());
  mockProbe.mockRejectedValueOnce(new Error('connection refused'));
  mockProbe.mockResolvedValueOnce({ ok: true });
  const context = createTestContext();
  await expect(resolveTenantPreflight(context)).rejects.toThrow('connection refused');
  await resolveTenantPreflight(context);
  expect(mockProbe).toHaveBeenCalledTimes(2);
});

test('a success memoizes - later requests do not re-probe', async () => {
  mockReadConfigFile.mockImplementation(readConfigImp());
  mockProbe.mockResolvedValue({ ok: true });
  const context = createTestContext();
  await resolveTenantPreflight(context);
  await resolveTenantPreflight(context);
  expect(mockProbe).toHaveBeenCalledTimes(1);
});

test('skips with a warning when the tenantConnections artifact is missing', async () => {
  mockReadConfigFile.mockImplementation(() => null);
  await resolveTenantPreflight(createTestContext());
  expect(logger.warn).toHaveBeenCalledWith(
    'Tenant preflight skipped - no tenantConnections.json build artifact. Rebuild with a matching lowdefy version to enable the unstamped-rows check.'
  );
  expect(mockProbe).not.toHaveBeenCalled();
});

test('skips a tenant-capable type without the preflight capability, with a warning', async () => {
  mockReadConfigFile.mockImplementation(
    readConfigImp({
      tenantConnections: [{ connectionId: 'walled', type: 'NoProbeTenantConnection' }],
    })
  );
  await resolveTenantPreflight(createTestContext());
  expect(logger.warn).toHaveBeenCalledWith(
    'Tenant preflight can not probe connection "walled" - connection type "NoProbeTenantConnection" implements the tenant contract but no tenantPreflight capability.'
  );
  expect(mockProbe).not.toHaveBeenCalled();
});

test('skips a connection whose properties do not evaluate outside a request, with a warning', async () => {
  mockReadConfigFile.mockImplementation(
    readConfigImp({
      connectionConfigs: {
        walled: {
          connectionId: 'walled',
          type: 'TestTenantConnection',
          properties: { databaseUri: { _throw: true }, collection: 'user-contacts' },
        },
      },
    })
  );
  const context = createTestContext();
  context.operators = {
    _throw: () => {
      throw new Error('needs a payload');
    },
  };
  await resolveTenantPreflight(context);
  expect(logger.warn).toHaveBeenCalledWith(
    expect.anything(),
    'Tenant preflight can not probe connection "walled" - its properties do not evaluate outside a request.'
  );
  expect(mockProbe).not.toHaveBeenCalled();
});

test('skips a connection whose artifact is missing, with a warning', async () => {
  mockReadConfigFile.mockImplementation(readConfigImp({ connectionConfigs: {} }));
  await resolveTenantPreflight(createTestContext());
  expect(logger.warn).toHaveBeenCalledWith(
    'Tenant preflight can not probe connection "walled" - no connection artifact found.'
  );
  expect(mockProbe).not.toHaveBeenCalled();
});
