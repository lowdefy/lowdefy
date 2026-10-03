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
import { Hono } from 'hono';

jest.unstable_mockModule('../../../lib/docs/clientErrorStore.js', () => ({
  default: { list: () => [] },
}));
jest.unstable_mockModule('../../../lib/docs/serverErrorStore.js', () => ({
  default: { list: () => [] },
}));
jest.unstable_mockModule('../../../lib/docs/getBuildId.js', () => ({
  default: () => '2026-10-03T08:00:00.000Z',
}));
jest.unstable_mockModule('../../../lib/docs/getPageBuildStatus.js', () => ({
  default: () => ({ unbuilt: 0 }),
}));
jest.unstable_mockModule('../../../lib/docs/readBuildArtifact.js', () => ({
  default: () => ({ status: 'ok', errors: [], warnings: [] }),
}));

const { default: docsBuildStatusHandler } = await import('./buildStatus.js');

test('GET /lowdefy-docs/build-status includes the buildId of the build being served', async () => {
  const app = new Hono();
  app.get('/lowdefy-docs/build-status', docsBuildStatusHandler);

  const res = await app.request('/lowdefy-docs/build-status');

  expect(res.status).toBe(200);
  expect((await res.json()).buildId).toBe('2026-10-03T08:00:00.000Z');
});
