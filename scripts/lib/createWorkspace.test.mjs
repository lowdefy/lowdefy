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

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import createWorkspace from './createWorkspace.mjs';
import { REPO_ROOT } from './parseArgs.mjs';

const YAML = createRequire(path.join(REPO_ROOT, 'packages/cli/package.json'))('yaml');

function setup({ appWorkspaceYaml, overrides } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'create-workspace-'));
  const targetDir = path.join(root, 'server');
  const configDirectory = path.join(root, 'repo', 'apps', 'app');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(configDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    JSON.stringify({ name: 'server', pnpm: { overrides: overrides ?? {} } })
  );
  if (appWorkspaceYaml) {
    fs.writeFileSync(path.join(root, 'repo', 'pnpm-workspace.yaml'), appWorkspaceYaml);
  }
  createWorkspace({ targetDir, configDirectory });
  const written = YAML.parse(fs.readFileSync(path.join(targetDir, 'pnpm-workspace.yaml'), 'utf8'));
  fs.rmSync(root, { recursive: true });
  return written;
}

test('createWorkspace writes the server build allowlist for an app in no pnpm workspace', () => {
  const workspace = setup();
  assert.deepEqual(workspace.packages, []);
  assert.deepEqual(workspace.allowBuilds, {
    '@sentry/cli': true,
    '@swc/core': true,
    'better-sqlite3': true,
    esbuild: true,
    'mongodb-memory-server': false,
    sharp: true,
  });
  assert.deepEqual(workspace.onlyBuiltDependencies, [
    '@sentry/cli',
    '@swc/core',
    'better-sqlite3',
    'esbuild',
    'sharp',
  ]);
  assert.deepEqual(workspace.ignoredBuiltDependencies, ['mongodb-memory-server']);
  assert.equal(workspace.overrides, undefined);
});

test("createWorkspace carries the app workspace's build approvals, the app's choice winning", () => {
  const workspace = setup({
    appWorkspaceYaml: [
      'packages:',
      '  - apps/*',
      'onlyBuiltDependencies:',
      '  - protobufjs',
      'ignoredBuiltDependencies:',
      '  - core-js',
      'allowBuilds:',
      "  '@pulumi/sentry': true",
      '  sharp: false',
      '',
    ].join('\n'),
  });
  assert.equal(workspace.allowBuilds.protobufjs, true);
  assert.equal(workspace.allowBuilds['core-js'], false);
  assert.equal(workspace.allowBuilds['@pulumi/sentry'], true);
  assert.equal(workspace.allowBuilds.sharp, false);
  assert.equal(workspace.allowBuilds.esbuild, true);
  assert.ok(workspace.onlyBuiltDependencies.includes('protobufjs'));
  assert.ok(workspace.ignoredBuiltDependencies.includes('sharp'));
  assert.ok(!workspace.onlyBuiltDependencies.includes('sharp'));
});

test('createWorkspace mirrors the package.json link: overrides into pnpm-workspace.yaml', () => {
  const workspace = setup({
    overrides: { '@lowdefy/helpers': 'link:../packages/utils/helpers' },
  });
  assert.deepEqual(workspace.overrides, {
    '@lowdefy/helpers': 'link:../packages/utils/helpers',
  });
});

test('createWorkspace keeps the server allowlist for an empty app pnpm-workspace.yaml', () => {
  const workspace = setup({ appWorkspaceYaml: '' });
  assert.equal(workspace.allowBuilds.esbuild, true);
  assert.equal(workspace.allowBuilds['mongodb-memory-server'], false);
});

test('createWorkspace throws on an app pnpm-workspace.yaml that does not parse', () => {
  assert.throws(() => setup({ appWorkspaceYaml: 'packages: [\n' }), /Could not parse/);
});
