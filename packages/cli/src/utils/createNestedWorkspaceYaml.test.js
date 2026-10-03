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
    parentWorkspace: { packages: ['apps/*'], rootDependencies: {}, settings: {} },
    workspaceRoot: '/repo',
  });
  expect(yaml).toEqual(`packages:
  - .
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
ignoredBuiltDependencies:
  - "@sentry/cli"
allowBuilds:
  better-sqlite3: true
  sharp: true
  "@sentry/cli": false
`);
});

test('createNestedWorkspaceYaml carries the parent settings and rebases patch paths', () => {
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: {
      packages: ['apps/*'],
      rootDependencies: {},
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
  "@sentry/cli": false
  esbuild: true
  sharp: false
catalog:
  react: 18.2.0
onlyBuiltDependencies:
  - better-sqlite3
  - esbuild
  - sharp
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
ignoredBuiltDependencies:
  - "@sentry/cli"
allowUnusedPatches: true
`);
});

test('createNestedWorkspaceYaml keeps the parent choice for a dependency with a default', () => {
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: {
      packages: ['apps/*'],
      rootDependencies: {},
      settings: {
        ignoredBuiltDependencies: ['sharp'],
        onlyBuiltDependencies: ['@sentry/cli'],
      },
    },
    workspaceRoot: '/repo',
  });
  expect(yaml).toEqual(`packages:
  - .
ignoredBuiltDependencies:
  - sharp
onlyBuiltDependencies:
  - better-sqlite3
  - "@sentry/cli"
allowBuilds:
  better-sqlite3: true
`);
});

test('createNestedWorkspaceYaml carries settings it does not know and rebases link: overrides', () => {
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: {
      packages: ['apps/*'],
      rootDependencies: { a: '1.2.3' },
      settings: {
        minimumReleaseAge: 1440,
        overrides: { a: '$a', b: 'link:./vendor/b' },
        supportedArchitectures: { os: ['current', 'linux'] },
      },
    },
    workspaceRoot: '/repo',
  });
  expect(yaml).toEqual(`packages:
  - .
minimumReleaseAge: 1440
overrides:
  a: 1.2.3
  b: link:../../../../vendor/b
supportedArchitectures:
  os:
    - current
    - linux
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
ignoredBuiltDependencies:
  - "@sentry/cli"
allowBuilds:
  better-sqlite3: true
  sharp: true
  "@sentry/cli": false
`);
});

test('createNestedWorkspaceYaml keeps the release-age exclusions pnpm wrote into the server file', () => {
  // As pnpm 11 leaves the file after installing versions younger than its
  // default minimumReleaseAge.
  const serverWorkspaceYaml = `packages:
  - .
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
ignoredBuiltDependencies:
  - "@sentry/cli"
allowBuilds:
  better-sqlite3: true
  sharp: true
  "@sentry/cli": false
minimumReleaseAgeExclude:
  - '@lowdefy/server@7.0.1'
  - '@lowdefy/api@7.0.1'
`;
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: { packages: ['apps/*'], rootDependencies: {}, settings: {} },
    serverWorkspaceYaml,
    workspaceRoot: '/repo',
  });
  expect(yaml).toEqual(`packages:
  - .
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
ignoredBuiltDependencies:
  - "@sentry/cli"
allowBuilds:
  better-sqlite3: true
  sharp: true
  "@sentry/cli": false
minimumReleaseAgeExclude:
  - "@lowdefy/api@7.0.1"
  - "@lowdefy/server@7.0.1"
`);
});

test('createNestedWorkspaceYaml merges the parent release-age exclusions with the ones pnpm wrote', () => {
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: {
      packages: ['apps/*'],
      rootDependencies: {},
      settings: {
        minimumReleaseAge: 1440,
        minimumReleaseAgeExclude: ['zod', '@lowdefy/api@7.0.1'],
      },
    },
    serverWorkspaceYaml: `minimumReleaseAgeExclude:
  - zod
  - '@lowdefy/api@7.0.1'
  - '@lowdefy/server@7.0.1'
`,
    workspaceRoot: '/repo',
  });
  expect(yaml).toEqual(`packages:
  - .
minimumReleaseAge: 1440
minimumReleaseAgeExclude:
  - "@lowdefy/api@7.0.1"
  - "@lowdefy/server@7.0.1"
  - zod
onlyBuiltDependencies:
  - better-sqlite3
  - sharp
ignoredBuiltDependencies:
  - "@sentry/cli"
allowBuilds:
  better-sqlite3: true
  sharp: true
  "@sentry/cli": false
`);
});

test('createNestedWorkspaceYaml writes the same file when given its own output, whatever order pnpm keeps', () => {
  const parentWorkspace = {
    packages: ['apps/*'],
    rootDependencies: {},
    settings: { minimumReleaseAgeExclude: ['zod'] },
  };
  const first = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace,
    serverWorkspaceYaml: `minimumReleaseAgeExclude:
  - zod
  - '@lowdefy/server@7.0.1'
  - '@lowdefy/api@7.0.1'
`,
    workspaceRoot: '/repo',
  });
  const second = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace,
    serverWorkspaceYaml: first,
    workspaceRoot: '/repo',
  });
  expect(second).toEqual(first);
});

test('createNestedWorkspaceYaml sorts the parent exclusions when the server file has none', () => {
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: {
      packages: ['apps/*'],
      rootDependencies: {},
      settings: { minimumReleaseAgeExclude: ['zod', 'axios'] },
    },
    serverWorkspaceYaml: 'packages:\n  - .\n',
    workspaceRoot: '/repo',
  });
  expect(yaml).toContain(`minimumReleaseAgeExclude:
  - axios
  - zod
`);
});

test('createNestedWorkspaceYaml writes the same file on the next run when the parent exclusions are unsorted', () => {
  const parentWorkspace = {
    packages: ['apps/*'],
    rootDependencies: {},
    settings: { minimumReleaseAgeExclude: ['zod', 'axios'] },
  };
  const first = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace,
    serverWorkspaceYaml: null,
    workspaceRoot: '/repo',
  });
  const second = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace,
    serverWorkspaceYaml: first,
    workspaceRoot: '/repo',
  });
  expect(second).toEqual(first);
});

test('createNestedWorkspaceYaml replaces a server file that does not parse', () => {
  const yaml = createNestedWorkspaceYaml({
    directory: '/repo/apps/app/.lowdefy/server',
    parentWorkspace: { packages: ['apps/*'], rootDependencies: {}, settings: {} },
    serverWorkspaceYaml: 'minimumReleaseAgeExclude: [\n',
    workspaceRoot: '/repo',
  });
  expect(yaml).not.toContain('minimumReleaseAgeExclude');
});
