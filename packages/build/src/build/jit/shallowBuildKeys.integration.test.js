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

// Regression: the dev server rebuilds config without restarting, and a page loaded or a
// request started before the rebuild still reports errors with the previous build's ~k
// keys. When every build numbered its keys from 1, such a key named another node of the
// new build and the error resolved to the wrong config location.

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { serializer } from '@lowdefy/helpers';
import { resolveConfigLocation } from '@lowdefy/errors';

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

const logger = { info: () => {}, log: () => {}, warn: () => {}, error: () => {} };

test('each dev config build names its nodes with keys no earlier build used', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-shallow-keys-'));
  const configDir = path.join(root, 'config');
  const serverDir = path.join(root, '.lowdefy', 'server');
  const buildDir = path.join(serverDir, 'build');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, 'lowdefy.yaml'),
    `lowdefy: local
name: Key Test
pages:
  - id: home
    type: Box
    blocks:
      - id: title
        type: Box
`
  );

  function readArtifact(name) {
    return serializer.deserialize(JSON.parse(fs.readFileSync(path.join(buildDir, name), 'utf8')));
  }

  async function build() {
    await shallowBuild({
      customTypesMap: snapshotTypesMap,
      directories: { config: configDir, build: buildDir, server: serverDir },
      logger,
      stage: 'dev',
    });
    return {
      idCounter: readArtifact('idCounter.json'),
      keyMap: readArtifact('keyMap.json'),
      refMap: readArtifact('refMap.json'),
    };
  }

  const first = await build();
  const second = await build();
  fs.rmSync(root, { recursive: true, force: true });

  expect(first.idCounter.prefix).not.toEqual(second.idCounter.prefix);
  const firstKeys = Object.keys(first.keyMap);
  expect(firstKeys.every((key) => key.startsWith(first.idCounter.prefix))).toBe(true);
  expect(firstKeys.filter((key) => Object.hasOwn(second.keyMap, key))).toEqual([]);

  const [staleKey] = firstKeys;
  expect(
    resolveConfigLocation({ configKey: staleKey, keyMap: second.keyMap, refMap: second.refMap })
  ).toBeNull();
});
