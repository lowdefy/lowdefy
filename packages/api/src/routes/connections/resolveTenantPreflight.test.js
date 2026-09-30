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
import { TenantIntegrityError } from '@lowdefy/errors';

import resolveTenantPreflight, { getTenantIntegrityStatus } from './resolveTenantPreflight.js';
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
  logger.error.mockReset();
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

test('serves and reports: one error log and one capture per offending target, never a throw', async () => {
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
  const captureError = jest.fn();
  const context = createTestContext();
  await expect(resolveTenantPreflight(context, { captureError })).resolves.toBeUndefined();
  // Deduped by evaluated target - two contacts connections share one probe.
  expect(mockProbe).toHaveBeenCalledTimes(2);
  expect(logger.error).toHaveBeenCalledTimes(2);
  expect(captureError).toHaveBeenCalledTimes(2);
  const [fields, message] = logger.error.mock.calls[0];
  expect(fields.event).toBe('tenant_integrity_error');
  expect(fields.collection).toBe('user-contacts');
  expect(fields.connectionIds).toEqual(['contacts-a', 'contacts-b']);
  expect(fields.field).toBe('organization_id');
  expect(fields.err).toBeInstanceOf(TenantIntegrityError);
  expect(message).toContain('collection "user-contacts" (connections "contacts-a", "contacts-b")');
  expect(captureError.mock.calls[1][0]).toBeInstanceOf(TenantIntegrityError);
  expect(captureError.mock.calls[1][0].collection).toBe('companies');
  expect(getTenantIntegrityStatus(context.config)).toEqual([
    expect.objectContaining({ collection: 'user-contacts', ok: false }),
    expect.objectContaining({ collection: 'companies', ok: false }),
  ]);
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

test('a report memoizes - the probe does not run again and nothing re-logs', async () => {
  mockReadConfigFile.mockImplementation(readConfigImp());
  mockProbe.mockResolvedValue({ ok: false });
  const context = createTestContext();
  await resolveTenantPreflight(context);
  await resolveTenantPreflight(context);
  expect(mockProbe).toHaveBeenCalledTimes(1);
  expect(logger.error).toHaveBeenCalledTimes(1);
});

test('a probe failure warns, never throws, and does not memoize - the next request retries', async () => {
  mockReadConfigFile.mockImplementation(readConfigImp());
  mockProbe.mockRejectedValueOnce(new Error('connection refused'));
  mockProbe.mockResolvedValueOnce({ ok: true });
  const context = createTestContext();
  await expect(resolveTenantPreflight(context)).resolves.toBeUndefined();
  expect(logger.warn).toHaveBeenCalledWith(
    expect.objectContaining({ err: expect.any(Error) }),
    expect.stringContaining('will retry on the next request')
  );
  expect(logger.error).not.toHaveBeenCalled();
  expect(getTenantIntegrityStatus(context.config)).toBeUndefined();
  await resolveTenantPreflight(context);
  expect(mockProbe).toHaveBeenCalledTimes(2);
  expect(getTenantIntegrityStatus(context.config)).toEqual([
    expect.objectContaining({ collection: 'user-contacts', ok: true }),
  ]);
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

const walledUri = 'mongodb://user:pw@host-a:27017,host-b:27017/app?replicaSet=rs';

function unwalledConfig({ unwalled }) {
  return readConfigImp({
    connectionConfigs: {
      walled: {
        connectionId: 'walled',
        type: 'TestTenantConnection',
        properties: { databaseUri: walledUri, collection: 'rows' },
      },
      ...unwalled,
    },
  });
}

function withUnwalled(unwalled) {
  const read = unwalledConfig({ unwalled });
  mockReadConfigFile.mockImplementation((path) =>
    path === 'unwalledConnections.json'
      ? Object.values(unwalled).map(({ connectionId, type }) => ({ connectionId, type }))
      : read(path)
  );
  mockProbe.mockResolvedValue({ ok: true });
}

test('warns when an unwalled connection holds a URI to the walled database', async () => {
  withUnwalled({
    plugin: {
      connectionId: 'plugin',
      type: 'Plugin',
      properties: {
        nested: { uri: 'mongodb://other:secret@host-b:27017,host-a:27017/app?authSource=admin' },
      },
    },
  });
  await resolveTenantPreflight(createTestContext());
  expect(logger.warn).toHaveBeenCalledTimes(1);
  expect(logger.warn.mock.calls[0][0]).toBe(
    'Connection "plugin" (Plugin) holds a URI to the database of walled connection "walled". Unwalled connections must not reach walled data: give the plugin a mongoConnectionId and use the walled MongoDB client (@lowdefy/connection-mongodb/walled). This becomes a build error in the next release.'
  );
});

test('does not warn for SMTP, a different database, or a different host', async () => {
  withUnwalled({
    mail: {
      connectionId: 'mail',
      type: 'Smtp',
      properties: { host: 'smtp.example.com', user: 'u' },
    },
    other_db: {
      connectionId: 'other_db',
      type: 'Plugin',
      properties: { uri: 'mongodb://user:pw@host-a:27017,host-b:27017/elsewhere' },
    },
    other_host: {
      connectionId: 'other_host',
      type: 'Plugin',
      properties: { uri: 'mongodb://user:pw@host-z:27017/app' },
    },
  });
  await resolveTenantPreflight(createTestContext());
  expect(logger.warn).not.toHaveBeenCalled();
});
