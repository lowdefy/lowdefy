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

import path from 'path';
import { fileURLToPath } from 'url';
import { createPlaywrightConfig } from '@lowdefy/block-dev-e2e';

import {
  appPort,
  cronSecret,
  externalMongoUri,
  mockPort,
  mockUrl,
  mongoPort,
  mongoUri,
} from './settings.js';

// The enrichment reference app (e2e/enrichment/app) and its end-to-end suite. It runs apart
// from the block suite (e2e/app) since it needs a MongoDB replica set, the mock services and
// CRON_SECRET, and its specs share one database, so they run one at a time.
//
//   pnpm --filter=@lowdefy/blocks-table e2e:enrichment
const enrichmentDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(enrichmentDir, '../..');
const monorepoRoot = path.resolve(packageDir, '../../../../');

const services = [
  {
    command: `node ${path.join(enrichmentDir, 'mocks/mockServices.mjs')} --port ${mockPort}`,
    url: `${mockUrl}/__health`,
    timeout: 30000,
  },
];
if (externalMongoUri === undefined) {
  services.push({
    command: `node ${path.join(monorepoRoot, 'scripts/e2e-mongodb.mjs')} --port ${mongoPort}`,
    port: mongoPort,
    timeout: 120000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
  });
}

export default createPlaywrightConfig({
  packageDir,
  port: appPort,
  appDir: path.join(enrichmentDir, 'app'),
  name: 'blocks-table-enrichment',
  testMatch: ['e2e/enrichment/tests/*.e2e.spec.js'],
  services,
  env: {
    CRON_SECRET: cronSecret,
    LOWDEFY_SECRET_ENRICHMENT_MONGODB_URI: mongoUri,
    LOWDEFY_SECRET_ENRICHMENT_API_URL: mockUrl,
    LOWDEFY_SECRET_ANTHROPIC_BASE_URL: `${mockUrl}/anthropic/v1`,
    LOWDEFY_SECRET_ANTHROPIC_API_KEY: 'mock-key',
    // The token the treg mock accepts.
    LOWDEFY_SECRET_TREG_TOKEN: 'mock-treg-token',
  },
  fullyParallel: false,
  workers: 1,
});
