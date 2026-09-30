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

// Ports and secrets of the enrichment e2e run, shared by the Playwright config (which starts
// the services and the app) and the specs (which call them). Every port moves with an
// environment variable, so worktrees can run the suite at the same time.
const appPort = Number(process.env.LOWDEFY_E2E_PORT ?? 3017);
const mockPort = Number(process.env.LOWDEFY_E2E_MOCK_PORT ?? appPort + 1);
const mongoPort = Number(process.env.LOWDEFY_E2E_MONGODB_PORT ?? 27197);

// An external MongoDB (a replica set, for change streams) can be passed instead of starting one.
const externalMongoUri = process.env.LOWDEFY_SECRET_ENRICHMENT_MONGODB_URI;
const mongoUri = externalMongoUri ?? `mongodb://127.0.0.1:${mongoPort}/enrichment_e2e`;

const mockUrl = `http://127.0.0.1:${mockPort}`;
const cronSecret = process.env.CRON_SECRET ?? 'enrichment-e2e-cron-secret';
// The secret the app's e2e-only api/test endpoints require (LOWDEFY_SECRET_ENRICHMENT_E2E_SECRET).
const e2eSecret = process.env.LOWDEFY_SECRET_ENRICHMENT_E2E_SECRET ?? 'enrichment-e2e-test-secret';

export { appPort, cronSecret, e2eSecret, externalMongoUri, mockPort, mockUrl, mongoPort, mongoUri };
