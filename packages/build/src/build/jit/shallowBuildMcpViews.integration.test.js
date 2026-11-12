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

// The dev skeleton build refuses the same view config as the full build. It
// runs over the full build's view error fixtures (tests/errors/V*), whose pages
// are written inline, and writes views.pages empty for an app that builds.

import { vi, afterAll, beforeAll, describe, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { serializer } from '@lowdefy/helpers';

process.env.AUTH_SECRET = 'test-secret-for-integration-test';

vi.doMock('../buildApp.js', () => ({
  default: ({ components }) => {
    components.app = components.app ?? {};
    components.app.html = components.app.html ?? {};
    components.app.html.appendBody = components.app.html.appendBody ?? '';
    components.app.html.appendHead = components.app.html.appendHead ?? '';
    components.appMeta = { gitSha: 'test-git-sha' };
    return components;
  },
}));
vi.doMock('../full/updateServerPackageJson.js', () => ({
  default: vi.fn(async () => {}),
}));
vi.doMock('../copyPublicFolder.js', () => ({
  default: vi.fn(async () => {}),
}));
vi.doMock('../copyAgentFileSystems.js', () => ({
  default: vi.fn(async () => {}),
}));

const { default: shallowBuild } = await import('./shallowBuild.js');
const { createRunBuild } = await import('../../test-utils/runBuild.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

const testsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../tests');
const errorFixturesDir = path.join(testsDir, 'errors');
const viewErrorFixtures = fs
  .readdirSync(errorFixturesDir)
  .filter((name) => /^V\d+-/.test(name))
  .sort();

let root;

beforeAll(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-shallow-mcp-views-'));
});

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('the skeleton build refuses invalid view config', () => {
  test('there is a fixture for each refusal', () => {
    expect(viewErrorFixtures).toEqual([
      'V1-mcp-view-missing-page',
      'V2-mcp-view-missing-path-params',
      'V3-mcp-view-no-oauth-provider',
      'V4-mcp-view-entrypoint-required-payload',
      'V5-mcp-view-endpoint-missing',
      'V6-response-outside-view',
    ]);
  });

  test.each(viewErrorFixtures)('%s', async (fixtureName) => {
    // The fixture is copied: the skeleton build writes its artifacts beside the config.
    const configDir = path.join(root, fixtureName);
    fs.cpSync(path.join(errorFixturesDir, fixtureName), configDir, { recursive: true });
    const runBuild = createRunBuild(shallowBuild, root);
    const expected = JSON.parse(fs.readFileSync(path.join(configDir, 'expected.json'), 'utf8'));
    const result = await runBuild(fixtureName, 'dev');

    expect(result.thrownError).not.toBeNull();
    for (const testCase of expected.tests) {
      for (const text of testCase.errorContains) {
        expect(result.errors.some((error) => error.includes(text))).toBe(true);
      }
    }
  });
});

test('the skeleton build writes views with no pages for an app with views', async () => {
  const configDir = path.join(root, 'views-app');
  const buildDir = path.join(configDir, '.lowdefy', 'server', 'build');
  fs.cpSync(path.join(testsDir, 'success', '111-mcp-views-app'), configDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });

  await shallowBuild({
    customTypesMap: snapshotTypesMap,
    directories: { config: configDir, build: buildDir, server: path.dirname(buildDir) },
    logger: { info: () => {}, log: () => {}, warn: () => {}, error: () => {}, succeed: () => {} },
    stage: 'dev',
  });

  const mcp = serializer.deserialize(
    JSON.parse(fs.readFileSync(path.join(buildDir, 'mcp.json'), 'utf8'))
  );
  expect(mcp.views).toEqual({
    configured: true,
    pages: {},
    sources: ['https://files.example.com', { _secret: 'ANALYTICS_ORIGIN' }],
  });
  expect(mcp.viewPages).toBeUndefined();
  expect(mcp.viewEndpoints).toBeUndefined();
  expect(mcp.endpoints.find((tool) => tool.id === 'open_task').view).toEqual({
    pageId: 'task',
    pathParams: { space: { _response: 'space.key' }, ref: { _payload: 'key' } },
    urlQuery: { tab: { _payload: 'tab' } },
    entrypoint: false,
  });
});
