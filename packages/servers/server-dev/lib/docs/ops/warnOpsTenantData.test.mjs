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
import os from 'node:os';
import path from 'node:path';

import { jest } from '@jest/globals';

const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-ops-tenant-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
const writeArtifact = (name, data) =>
  fs.writeFileSync(path.join(fixtureDir, 'build', name), JSON.stringify(data));
process.chdir(fixtureDir);

const { default: warnOpsTenantData } = await import('./warnOpsTenantData.js');

function setCredentials() {
  process.env.LOWDEFY_OPS_QUERY_URL = 'https://api.axiom.co';
  process.env.LOWDEFY_OPS_READ_TOKEN = 'read-only';
  process.env.LOWDEFY_OPS_DATASET = 'lowdefy-prod';
}

beforeEach(() => {
  delete process.env.LOWDEFY_OPS_QUERY_URL;
  delete process.env.LOWDEFY_OPS_READ_TOKEN;
  delete process.env.LOWDEFY_OPS_DATASET;
  writeArtifact('tenantConnections.json', []);
});

test('warnOpsTenantData warns once when a tenant-walled app has ops credentials', () => {
  setCredentials();
  writeArtifact('tenantConnections.json', [{ connectionId: 'orders', type: 'MongoDBCollection' }]);
  const logger = { warn: jest.fn() };
  expect(warnOpsTenantData({ logger })).toBe(true);
  expect(logger.warn).toHaveBeenCalledTimes(1);
  const [details, message] = logger.warn.mock.calls[0];
  expect(details).toEqual({
    event: 'ops_tenant_data_warning',
    tenantConnections: ['orders'],
  });
  expect(message).toContain('config.ops.enabled: false');
});

test('warnOpsTenantData is silent for an app with no tenant-walled connections', () => {
  setCredentials();
  const logger = { warn: jest.fn() };
  expect(warnOpsTenantData({ logger })).toBe(false);
  expect(logger.warn).not.toHaveBeenCalled();
});

test('warnOpsTenantData is silent when no ops credentials are set', () => {
  writeArtifact('tenantConnections.json', [{ connectionId: 'orders' }]);
  const logger = { warn: jest.fn() };
  expect(warnOpsTenantData({ logger })).toBe(false);
  expect(logger.warn).not.toHaveBeenCalled();
});
