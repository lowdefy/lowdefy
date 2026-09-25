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

// Regression: pages written inline in lowdefy.yaml are built only by the dev
// skeleton build (buildShallowPages) - buildPageJit serves them from that
// artifact without re-validating. The skeleton build must check their icon
// names like the full build, or an unknown icon fails `lowdefy build` and
// only renders the fallback icon in `lowdefy dev`.

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
    components.appMeta = {
      slug: components.slug ?? null,
      name: components.name ?? null,
      version: components.version ?? null,
      description: components.description ?? null,
      license: components.license ?? null,
      lowdefyVersion: components.lowdefy ?? null,
      gitSha: 'test-git-sha',
    };
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

// The dev server's types map includes the CallAPI action plugin.
const typesMap = {
  ...snapshotTypesMap,
  actions: {
    ...snapshotTypesMap.actions,
    CallAPI: { package: '@lowdefy/actions-core' },
  },
};

const logger = {
  info: () => {},
  log: () => {},
  warn: () => {},
  error: () => {},
  succeed: () => {},
};

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-shallow-inline-icons-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

async function runShallowBuild({ files }) {
  const configDir = path.join(root, 'config');
  const serverDir = path.join(root, '.lowdefy', 'server');
  const buildDir = path.join(serverDir, 'build');
  fs.mkdirSync(buildDir, { recursive: true });
  Object.entries(files).forEach(([fileName, content]) => {
    const filePath = path.join(configDir, fileName);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  });
  const result = await shallowBuild({
    customTypesMap: typesMap,
    directories: { config: configDir, build: buildDir, server: serverDir },
    logger,
    stage: 'dev',
  });
  return result;
}

const inlinePage = (icon) => `lowdefy: local
name: Inline Icon Test
pages:
  - id: inline
    type: Box
    blocks:
      - id: button
        type: Button
        properties:
          title: Delete
          icon: ${icon}
`;

test('skeleton build fails when an inline page uses an old react-icons name', async () => {
  const error = await runShallowBuild({ files: { 'lowdefy.yaml': inlinePage('AiOutlineDelete') } })
    .then(() => null)
    .catch((err) => err);
  expect(error).not.toBeNull();
  expect(error.errors.map((item) => item.message)).toContainEqual(
    expect.stringContaining('Icon "AiOutlineDelete" is a react-icons name.')
  );
});

test('skeleton build accepts semantic and Lucide names on inline pages', async () => {
  await expect(
    runShallowBuild({ files: { 'lowdefy.yaml': inlinePage('delete') } })
  ).resolves.toBeDefined();
  await expect(
    runShallowBuild({ files: { 'lowdefy.yaml': inlinePage('Trash') } })
  ).resolves.toBeDefined();
});
