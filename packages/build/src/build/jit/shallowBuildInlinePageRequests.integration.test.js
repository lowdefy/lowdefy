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

// Pages written inline in lowdefy.yaml are built only by the dev skeleton
// build (buildShallowPages). Like the full build, it must write each request's
// server-only keys (properties, type, connectionId, auth) to the request
// artifact only, never to the page artifact the dev client receives.

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.AUTH_SECRET = 'test-secret-for-integration-test';

jest.unstable_mockModule('../buildApp.js', () => ({
  default: ({ components }) => {
    components.app = components.app ?? {};
    components.app.html = components.app.html ?? {};
    components.app.html.appendBody = components.app.html.appendBody ?? '';
    components.app.html.appendHead = components.app.html.appendHead ?? '';
    components.appMeta = { gitSha: 'test-git-sha' };
    return components;
  },
}));
jest.unstable_mockModule('../full/updateServerPackageJson.js', () => ({
  default: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../copyPublicFolder.js', () => ({
  default: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../copyAgentFileSystems.js', () => ({
  default: jest.fn(async () => {}),
}));

const { default: shallowBuild } = await import('./shallowBuild.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

const logger = {
  info: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
  succeed: () => {},
};

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-shallow-inline-requests-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('skeleton build writes inline page requests without internals, which stay in the request artifact', async () => {
  const configDir = path.join(root, 'config');
  const serverDir = path.join(root, '.lowdefy', 'server');
  const buildDir = path.join(serverDir, 'build');
  fs.mkdirSync(buildDir, { recursive: true });
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, 'lowdefy.yaml'),
    `lowdefy: local
name: Inline Requests Test
connections:
  - id: api
    type: AxiosHttp
    properties:
      baseURL: http://localhost
pages:
  - id: inline
    type: Box
    requests:
      - id: get_items
        type: AxiosHttp
        connectionId: api
        payload:
          search:
            _state: search
        properties:
          url: /items
`
  );

  await shallowBuild({
    customTypesMap: snapshotTypesMap,
    directories: { config: configDir, build: buildDir, server: serverDir },
    logger,
    stage: 'dev',
  });

  function readArtifact(filePath) {
    return JSON.parse(fs.readFileSync(path.join(buildDir, filePath), 'utf8'));
  }

  const page = readArtifact('pages/inline.json');
  expect(page.requests).toHaveLength(1);
  const pageRequest = page.requests[0];
  expect(pageRequest).toMatchObject({
    id: 'request:inline:get_items',
    requestId: 'get_items',
    pageId: 'inline',
    payload: { search: { _state: 'search' } },
  });
  expect(pageRequest).not.toHaveProperty('properties');
  expect(pageRequest).not.toHaveProperty('type');
  expect(pageRequest).not.toHaveProperty('connectionId');
  expect(pageRequest).not.toHaveProperty('auth');

  const requestArtifact = readArtifact('pages/inline/requests/get_items.json');
  expect(requestArtifact).toMatchObject({
    type: 'AxiosHttp',
    connectionId: 'api',
    auth: { public: true },
    properties: { url: '/items' },
  });
});
