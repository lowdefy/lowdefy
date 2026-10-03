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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { Hono } from 'hono';
import { jest } from '@jest/globals';

const BUILD_A = '2026-10-03T14:02:00.000Z';
const BUILD_B = '2026-10-03T14:05:00.000Z';
let mockBuildId = BUILD_A;
jest.unstable_mockModule('../../lib/docs/getBuildId.js', () => ({
  default: () => mockBuildId,
}));

const mockGetPageConfig = jest.fn();
jest.unstable_mockModule('@lowdefy/api', () => ({
  getPageConfig: mockGetPageConfig,
}));

// No JIT build work in these tests — the route's build branch is exercised
// elsewhere; here we only drive the getPageConfig status fork.
const mockGetPageJitEnrichment = jest.fn(() => ({}));
jest.unstable_mockModule('../../lib/server/jitPageBuilder.js', () => ({
  default: jest.fn(async () => undefined),
  getPageJitEnrichment: mockGetPageJitEnrichment,
}));

jest.unstable_mockModule('../../lib/build/auth.js', () => ({
  default: { authPages: { signIn: '/auth/login', twoFactorEnrol: '/two-factor-enrol' } },
}));

jest.unstable_mockModule('../../lib/build/config.js', () => ({
  default: { basePath: '' },
}));

const { default: jitPageHandler } = await import('./jitPage.js');
const { default: devRecordingHandler } = await import('./devRecording.js');
const { default: servedBuilds } = await import('../../lib/server/recording/servedBuilds.js');

function createApp() {
  const app = new Hono();
  app.use('*', async (c, next) => {
    c.set('lowdefyContext', {
      buildDirectory: '/build',
      configDirectory: '/config',
      logger: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
      handleError: jest.fn(),
    });
    await next();
  });
  app.all('/api/page/*', jitPageHandler);
  app.post('/api/dev-recording', devRecordingHandler);
  return app;
}

afterEach(() => {
  mockGetPageConfig.mockReset();
  mockBuildId = BUILD_A;
});

test('jitPageHandler redirects to the two-factor enrolment page with a 403 when enrol_required', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'enrol_required' });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(403);
  const body = await res.json();
  expect(body).toEqual({ redirect: '/two-factor-enrol?callbackUrl=%2Fdashboard' });
});

test('jitPageHandler still returns a 401 sign-in redirect when unauthenticated', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'unauthenticated' });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(401);
  const body = await res.json();
  expect(body).toEqual({ redirect: '/auth/login?callbackUrl=%2Fdashboard' });
});

test('jitPageHandler still returns a 404 when the page is not found', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'not_found' });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(404);
  expect(await res.text()).toEqual('Page not found.');
});

test('jitPageHandler returns the pageConfig when status is ok', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'ok', pageConfig: { id: 'dashboard' } });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body).toEqual({ id: 'dashboard', _buildId: BUILD_A });
});

test('jitPageHandler folds _jsEntries and _dynamicIcons onto the ok response', async () => {
  mockGetPageConfig.mockResolvedValue({ status: 'ok', pageConfig: { id: 'dashboard' } });
  mockGetPageJitEnrichment.mockReturnValueOnce({
    jsEntries: 'export default {};',
    dynamicIcons: { Zap: { node: [['path', { d: 'M0 0' }]] } },
  });
  const res = await createApp().request('/api/page/dashboard');
  expect(res.status).toEqual(200);
  const body = await res.json();
  expect(body).toEqual({
    id: 'dashboard',
    _buildId: BUILD_A,
    _jsEntries: 'export default {};',
    _dynamicIcons: { Zap: { node: [['path', { d: 'M0 0' }]] } },
  });
});

test('jitPageHandler names the build it served, and the recording route keeps that build after a rebuild', async () => {
  const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-jit-page-build-'));
  process.env.LOWDEFY_DIRECTORY_CONFIG = configDirectory;
  try {
    mockGetPageConfig.mockResolvedValue({ status: 'ok', pageConfig: { id: 'dashboard' } });
    const app = createApp();
    const page = await (await app.request('/api/page/dashboard')).json();
    expect(page._buildId).toBe(BUILD_A);
    expect(servedBuilds.has(BUILD_A)).toBe(true);

    mockBuildId = BUILD_B;
    const session = '20261003T140311Z-k3x9qa';
    const res = await app.request('/api/dev-recording', {
      method: 'POST',
      headers: {
        host: 'localhost:3001',
        origin: 'http://localhost:3001',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        session,
        records: [
          {
            v: 1,
            session,
            t: '2026-10-03T14:04:00.000Z',
            kind: 'click',
            scope: 'page',
            page_id: 'dashboard',
            event: null,
            build: page._buildId,
          },
        ],
      }),
    });
    expect(res.status).toBe(204);
    const file = path.join(
      configDirectory,
      '.lowdefy',
      'traces',
      'dev',
      '2026-10-03',
      `${session}.jsonl`
    );
    expect(JSON.parse(fs.readFileSync(file, 'utf8').trim()).build).toBe(BUILD_A);
  } finally {
    fs.rmSync(configDirectory, { recursive: true, force: true });
    delete process.env.LOWDEFY_DIRECTORY_CONFIG;
  }
});
