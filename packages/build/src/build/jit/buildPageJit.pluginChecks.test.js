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

import { vi, afterAll, beforeAll, expect, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

const realNodeUtils = await import('@lowdefy/node-utils');
vi.doMock('@lowdefy/node-utils', () => ({
  ...realNodeUtils,
  writeFile: vi.fn().mockResolvedValue(undefined),
  writeFileIfChanged: vi.fn().mockResolvedValue(true),
}));

const { default: testContext } = await import('../../test-utils/testContext.js');
const { snapshotTypesMap } = await import('../../test-utils/runBuildForSnapshots.js');
const { default: makeId } = await import('../../utils/makeId.js');
const { default: buildPageJit } = await import('./buildPageJit.js');

let serverDir;

beforeAll(() => {
  serverDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-jit-plugin-checks-'));
  const pkgDir = path.join(serverDir, 'node_modules', '@lowdefy-test', 'jit-rules');
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(path.join(serverDir, 'package.json'), '{ "name": "server" }\n');
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({
      name: '@lowdefy-test/jit-rules',
      type: 'module',
      exports: { './checks': './checks.js' },
    })
  );
  fs.writeFileSync(
    path.join(pkgDir, 'checks.js'),
    `export default {
  operators: {
    _if: [{ id: 'if-test', level: 'error', description: '', check: ({ params }) =>
      ('test' in params ? null : '_if has no test key.') }],
  },
};
`
  );
});

afterAll(() => {
  fs.rmSync(serverDir, { recursive: true, force: true });
});

test('buildPageJit runs plugin rules on the page nodes', async () => {
  makeId.reset();
  const context = testContext({
    readConfigFile: () => `
id: home
type: Box
blocks:
  - id: title
    type: Title
    properties:
      content:
        _if:
          then:
            _state: flag
          else: No
`,
    writeBuildArtifact: vi.fn().mockResolvedValue(undefined),
  });
  context.directories.server = serverDir;
  context.errors = [];
  context.typesMap = {
    ...snapshotTypesMap,
    operators: {
      ...snapshotTypesMap.operators,
      client: { ...snapshotTypesMap.operators.client, _if: { package: '@lowdefy-test/jit-rules' } },
    },
  };
  context.unresolvedRefVars = {};
  const pageRegistry = new Map([
    [
      'home',
      {
        pageId: 'home',
        auth: { public: true },
        refId: 'ref-home',
        refPath: 'home.yaml',
        unresolvedVars: null,
      },
    ],
  ]);

  const error = await buildPageJit({ pageId: 'home', pageRegistry, context }).catch((e) => e);

  expect(error.message).toBe('Page "home" build failed with 1 error(s).');
  expect(error.buildErrors.map((buildError) => [buildError.message, buildError.checkSlug])).toEqual(
    [['_if has no test key.', 'if-test']]
  );
  expect(context.errors).toEqual([]);
});
