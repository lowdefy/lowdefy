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

import createNestedWorkspaceYaml from './createNestedWorkspaceYaml.js';

test('createNestedWorkspaceYaml writes the default build allowlist when the parent sets nothing', () => {
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: { packages: ['apps/*'], settings: {} },
    workspaceRoot: '/repo',
  });
  expect(yaml).toEqual(`packages:
  - .
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
allowBuilds:
  better-sqlite3: true
  sharp: true
`);
});

test('createNestedWorkspaceYaml carries the parent settings and rebases patch paths', () => {
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: {
      packages: ['apps/*'],
      settings: {
        allowBuilds: { esbuild: true, sharp: false },
        catalog: { react: '18.2.0' },
        onlyBuiltDependencies: ['esbuild', 'sharp'],
        overrides: { 'is-number': '7.0.0' },
        packageExtensions: { dayjs: { peerDependencies: { a: '*' } } },
        patchedDependencies: { 'dayjs@1.11.20': 'patches/dayjs@1.11.20.patch' },
        peerDependencyRules: { ignoreMissing: ['b'] },
      },
    },
    workspaceRoot: '/repo',
  });
  expect(yaml).toEqual(`packages:
  - .
allowBuilds:
  better-sqlite3: true
  sharp: false
  esbuild: true
catalog:
  react: 18.2.0
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
  - esbuild
overrides:
  is-number: 7.0.0
packageExtensions:
  dayjs:
    peerDependencies:
      a: "*"
patchedDependencies:
  dayjs@1.11.20: ../../../../patches/dayjs@1.11.20.patch
peerDependencyRules:
  ignoreMissing:
    - b
allowUnusedPatches: true
`);
});
