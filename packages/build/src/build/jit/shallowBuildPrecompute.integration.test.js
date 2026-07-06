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

// Regression: the skeleton (shallow/dev) build must run the
// precomputeRuntimeOperators phase like the full build does. Without it,
// content preserved at skeleton — inline pages defined directly in
// lowdefy.yaml — reaches testSchema with raw runtime operators (spurious
// "Block id should be a string" warnings) and, worse, is SERVED that way in
// dev: the client never operator-evaluates id positions, so a _string.concat
// block id works in prod and breaks in dev.

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { serializer } from '@lowdefy/helpers';

process.env.NEXTAUTH_SECRET = 'test-secret-for-integration-test';

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

test('skeleton build folds static runtime operators in preserved inline pages', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-shallow-precompute-'));
  const configDir = path.join(root, 'config');
  const buildDir = path.join(root, '.lowdefy', 'server', 'build');
  fs.mkdirSync(configDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });

  fs.writeFileSync(
    path.join(configDir, 'lowdefy.yaml'),
    `lowdefy: local
name: Shallow Precompute Test

pages:
  - id: inline
    type: Box
    blocks:
      - id:
          _string.concat:
            - inline
            - _block
        type: Box
        blocks:
          _if:
            test:
              _if_none:
                - null
                - true
            then:
              - id: nested
                type: Box
            else: []
`
  );

  const warnings = [];
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
      warn: (arg) => warnings.push(typeof arg === 'string' ? arg : (arg?.msg ?? '')),
      error: () => {},
      succeed: () => {},
    },
    stage: 'dev',
  });

  // No spurious schema warnings about unfolded operators.
  const schemaWarnings = warnings.filter(
    (w) => String(w).includes('should be a string') || String(w).includes('should be an array')
  );
  expect(schemaWarnings).toEqual([]);

  // The served inline page artifact holds folded, concrete values — the same
  // shape prod produces (built pages nest blocks under slots.content.blocks).
  const page = serializer.deserialize(
    JSON.parse(fs.readFileSync(path.join(buildDir, 'pages', 'inline.json'), 'utf8'))
  );
  const outer = page.slots.content.blocks[0];
  expect(outer.blockId).toBe('inline_block');
  expect(outer.slots.content.blocks[0].blockId).toBe('nested');
});
