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

// Regression: the file that holds the pages list (pages: { _ref: pages.yaml },
// or a module's pages list) decides which pages exist. It must be recorded in
// skeletonSourceFiles.json, otherwise the dev server treats adding a page to
// it as a page-only change and the new page never reaches the page registry.
// The page files it references, and the templates they ref, stay page content.

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.AUTH_SECRET = 'test-secret-for-integration-test';

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

function writeFixture(configDir) {
  const write = (file, content) => {
    const filePath = path.join(configDir, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  };
  write(
    'lowdefy.yaml',
    `lowdefy: local
name: Skeleton Pages List Test

modules:
  - id: mod
    source: 'file:modules/mod'

pages:
  _ref: pages.yaml
`
  );
  write(
    'pages.yaml',
    `- _ref: pages/home.yaml
- _ref: pages/about.yaml
`
  );
  write(
    'pages/home.yaml',
    `_ref:
  path: templates/page.yaml
  vars:
    id: home
`
  );
  write(
    'templates/page.yaml',
    `id:
  _var: id
type: Box
blocks:
  - _ref: components/title.yaml
`
  );
  write(
    'components/title.yaml',
    `id: title
type: Box
`
  );
  write(
    'pages/about.yaml',
    `id: about
type: Box
`
  );
  write(
    'modules/mod/module.lowdefy.yaml',
    `name: Mod
exports:
  pages:
    - id: settings
pages:
  _ref: pages.yaml
`
  );
  write(
    'modules/mod/pages.yaml',
    `- _ref: pages/settings.yaml
`
  );
  write(
    'modules/mod/pages/settings.yaml',
    `id: settings
type: Box
`
  );
}

test('skeleton source files include the app and module pages list files, not the page files', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-skeleton-pages-list-'));
  const configDir = path.join(root, 'config');
  const buildDir = path.join(root, '.lowdefy', 'server', 'build');
  fs.mkdirSync(buildDir, { recursive: true });
  writeFixture(configDir);

  await shallowBuild({
    customTypesMap: snapshotTypesMap,
    directories: {
      config: configDir,
      build: buildDir,
      server: path.join(root, '.lowdefy', 'server'),
    },
    logger: {
      info: () => {},
      log: () => {},
      warn: () => {},
      error: () => {},
      succeed: () => {},
    },
    stage: 'dev',
  });

  const skeletonSourceFiles = JSON.parse(
    fs.readFileSync(path.join(buildDir, 'skeletonSourceFiles.json'), 'utf8')
  );
  expect(skeletonSourceFiles).toEqual(
    [path.join(configDir, 'modules', 'mod', 'pages.yaml'), 'pages.yaml'].sort()
  );
});
