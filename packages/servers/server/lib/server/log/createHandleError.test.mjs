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

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { vi, afterEach, beforeEach, expect, test } from 'vitest';
import { TenantIntegrityError } from '@lowdefy/errors';

const secret = 'planted-handle-error-secret';

process.env.LOWDEFY_SECRET_API_KEY = secret;

const { default: createHandleError } = await import('./createHandleError.js');

function createAxiosError() {
  const error = new Error(`Request failed for key ${secret}`);
  error.name = 'AxiosError';
  error.code = 'ERR_BAD_REQUEST';
  error.config = {
    auth: { username: 'svc-user', password: 'planted-config-password' },
    params: { api_key: 'planted-config-param' },
    headers: { Authorization: 'Bearer planted-config-header' },
  };
  return error;
}

function testContext({ logger, headers } = {}) {
  return {
    headers,
    logger: logger ?? { error: vi.fn() },
    readConfigFile: vi.fn(async () => null),
    req: { url: '/api/request/page/req', method: 'POST', hostname: 'app.example.com' },
  };
}

beforeEach(() => {
  console.error = vi.fn();
});

test('handleError logs the referer header with credential query parameters redacted', async () => {
  const context = testContext({
    headers: { referer: 'https://app.example.com/verify?token=planted-token&page=2' },
  });
  const handleError = createHandleError({ context });

  await handleError(new Error('Failed.'));

  const [fields] = context.logger.error.mock.calls[0];
  expect(fields.headers.referer).toBe('https://app.example.com/verify?token=%5Bredacted%5D&page=2');
});

test('handleError fallback output carries no axios config auth and no planted secret when the log call throws', async () => {
  const logError = new Error(`Log sink rejected ${secret}`);
  const context = testContext({
    logger: {
      error: vi.fn(() => {
        throw logError;
      }),
    },
  });
  const handleError = createHandleError({ context });

  await handleError(createAxiosError());

  expect(console.error).toHaveBeenCalledTimes(3);
  const output = console.error.mock.calls.map(([line]) => line).join('\n');
  expect(output).not.toContain('planted-config-password');
  expect(output).not.toContain('planted-config-param');
  expect(output).not.toContain('planted-config-header');
  expect(output).not.toContain(secret);
  const logged = JSON.parse(console.error.mock.calls[0][0]);
  expect(logged.message).toBe('Request failed for key [REDACTED]');
  expect(logged.code).toBe('ERR_BAD_REQUEST');
  expect(JSON.parse(console.error.mock.calls[2][0]).message).toBe('Log sink rejected [REDACTED]');
});

test('handleError logs a TenantIntegrityError as tenant_integrity_error with endpoint and organization', async () => {
  const context = testContext();
  context.endpointId = 'save-contact';
  context.user = { id: 'u1', organization_id: 'org_a' };
  const handleError = createHandleError({ context });

  await handleError(
    new TenantIntegrityError('bad row', { collection: 'contacts', organizationId: 'org_a' })
  );

  const [fields] = context.logger.error.mock.calls[0];
  expect(fields.event).toBe('tenant_integrity_error');
  expect(fields.endpointId).toBe('save-contact');
  expect(fields.organization_id).toBe('org_a');
});

// The location tests load createHandleError afresh, so each starts with
// readMaps' per-process load not yet made. The error classes come from the same
// load, so the sink's instanceof checks see them.
const keyMap = {
  k1: { s: 'root', p: 'k0', r: 'ref_0', l: 1 },
  k2: { s: '.pages[0:home]', p: 'k1', r: 'ref_1', l: 1 },
  k3: { s: '.blocks[0:header]', p: 'k2', l: 5 },
};
const refMap = { ref_0: { path: 'lowdefy.yaml' }, ref_1: { path: 'pages/home.yaml' } };

let buildDirectory;

function writeGzippedMaps() {
  fs.writeFileSync(
    path.join(buildDirectory, 'keyMap.json.gz'),
    zlib.gzipSync(JSON.stringify(keyMap))
  );
  fs.writeFileSync(
    path.join(buildDirectory, 'refMap.json.gz'),
    zlib.gzipSync(JSON.stringify(refMap))
  );
}

async function loadFresh() {
  vi.resetModules();
  const { default: freshCreateHandleError } = await import('./createHandleError.js');
  const errors = await import('@lowdefy/errors');
  return { createHandleError: freshCreateHandleError, errors };
}

function mapsContext() {
  return {
    ...testContext({ logger: { error: vi.fn(), warn: vi.fn() } }),
    buildDirectory,
  };
}

function mapReads(readFile) {
  return readFile.mock.calls
    .map(([filePath]) => path.basename(String(filePath)))
    .filter((name) => name.startsWith('keyMap.json') || name.startsWith('refMap.json'));
}

function configFileMapReads(context) {
  return context.readConfigFile.mock.calls.filter(
    ([filePath]) => filePath === 'keyMap.json' || filePath === 'refMap.json'
  );
}

beforeEach(() => {
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-handle-error-'));
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('handleError logs the source and config of an error from the gzipped maps', async () => {
  writeGzippedMaps();
  const { createHandleError: create, errors } = await loadFresh();
  const context = mapsContext();
  const handleError = create({ context });

  await handleError(new errors.ConfigError('Bad config.', { configKey: 'k3' }));

  const [fields] = context.logger.error.mock.calls[0];
  expect(fields.source).toBe('pages/home.yaml:5');
  expect(fields.config).toBe('root.pages[0:home].blocks[0:header]');
  expect(configFileMapReads(context)).toEqual([]);
});

test('handleError reads no maps for a LowdefyInternalError', async () => {
  writeGzippedMaps();
  const { createHandleError: create, errors } = await loadFresh();
  const context = mapsContext();
  const readFile = vi.spyOn(fsPromises, 'readFile');
  const handleError = create({ context });

  await handleError(new errors.LowdefyInternalError('Unexpected condition.', { configKey: 'k3' }));

  expect(mapReads(readFile)).toEqual([]);
  expect(context.readConfigFile).not.toHaveBeenCalled();
  const [fields] = context.logger.error.mock.calls[0];
  expect(fields.source).toBeNull();
});

test('handleError on a build with no maps logs every error without a location and reads for the maps once', async () => {
  const { createHandleError: create, errors } = await loadFresh();
  const context = mapsContext();
  const readFile = vi.spyOn(fsPromises, 'readFile');
  const handleError = create({ context });

  for (let i = 0; i < 100; i += 1) {
    await handleError(new errors.ConfigError('Bad config.', { configKey: 'k3' }));
  }

  expect(context.logger.error).toHaveBeenCalledTimes(100);
  context.logger.error.mock.calls.forEach(([fields]) => {
    expect(fields.source).toBeNull();
    expect(fields.config).toBeNull();
  });
  expect(console.error).not.toHaveBeenCalled();
  expect(mapReads(readFile).sort()).toEqual(['keyMap.json.gz', 'refMap.json.gz']);
  expect(configFileMapReads(context)).toEqual([]);
  expect(context.logger.warn).not.toHaveBeenCalled();
});
