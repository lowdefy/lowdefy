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

// Regression: files _ref'd from app-level config that resolve to scalars
// (e.g. app.html.appendHead: {_ref: head.html}) must be recorded in
// skeletonSourceFiles.json — otherwise the dev server treats an edit to
// head.html as a page-only change and never rebuilds the app artifact that
// embeds it, so the served HTML goes stale until a manual restart.

import { vi, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

process.env.AUTH_SECRET = 'test-secret-for-integration-test';

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
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');

test('skeleton source files include scalar-resolving refs from app config', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-skeleton-head-'));
  const configDir = path.join(root, 'config');
  const buildDir = path.join(root, '.lowdefy', 'server', 'build');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });

  fs.writeFileSync(
    path.join(configDir, 'head.html'),
    '<link href="https://example.com/fonts.css" rel="stylesheet" crossorigin="anonymous">\n'
  );
  fs.writeFileSync(
    path.join(configDir, 'lowdefy.yaml'),
    `lowdefy: local
name: Skeleton Head Test

app:
  html:
    appendHead:
      _ref: head.html

pages:
  - id: home
    type: Box
`
  );

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
  expect(skeletonSourceFiles).toContain('head.html');
});
