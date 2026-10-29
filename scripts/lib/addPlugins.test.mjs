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
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import addPlugins from './addPlugins.mjs';

const logger = { info: () => {}, warn: () => {} };

// An app in its own pnpm workspace outside this repository, and a server copy
// whose package.json files look as rewriteDeps leaves them.
function setup({ plugins, serverDependencies = {}, overrides = {} }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'add-plugins-'));
  const repo = path.join(root, 'outside-repo');
  const configDirectory = path.join(repo, 'apps', 'app');
  const pluginDirectory = path.join(repo, 'plugins', 'acme-plugin');
  const targetDir = path.join(root, 'server');
  fs.mkdirSync(configDirectory, { recursive: true });
  fs.mkdirSync(pluginDirectory, { recursive: true });
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(
    path.join(repo, 'pnpm-workspace.yaml'),
    'packages:\n  - apps/*\n  - plugins/*\n'
  );
  fs.writeFileSync(
    path.join(pluginDirectory, 'package.json'),
    JSON.stringify({ name: '@acme/plugin', version: '1.0.0' })
  );
  fs.writeFileSync(
    path.join(configDirectory, 'lowdefy.yaml'),
    [
      'lowdefy: 7.1.0',
      'plugins:',
      ...plugins.flatMap(({ name, version }) => [`  - name: '${name}'`, `    version: ${version}`]),
      'pages: []',
      '',
    ].join('\n')
  );
  const serverPackage = JSON.stringify({
    name: '@lowdefy/server',
    dependencies: serverDependencies,
    pnpm: { overrides },
  });
  fs.writeFileSync(path.join(targetDir, 'package.json'), serverPackage);
  fs.writeFileSync(path.join(targetDir, 'package.original.json'), serverPackage);
  return { configDirectory, pluginDirectory, root, targetDir };
}

function readServerPackages(targetDir) {
  return ['package.json', 'package.original.json'].map((fileName) =>
    JSON.parse(fs.readFileSync(path.join(targetDir, fileName), 'utf8'))
  );
}

test('addPlugins links a workspace:* plugin of an app outside this repository', () => {
  const { configDirectory, pluginDirectory, root, targetDir } = setup({
    plugins: [{ name: '@acme/plugin', version: "'workspace:*'" }],
  });
  const peerLookups = [];
  addPlugins({
    configDirectory,
    targetDir,
    logger,
    getPeerDependencies: (args) => {
      peerLookups.push(args);
      return {};
    },
  });
  const link = `link:${path.relative(targetDir, pluginDirectory)}`;
  for (const pkg of readServerPackages(targetDir)) {
    assert.equal(pkg.dependencies['@acme/plugin'], link);
    assert.equal(pkg.pnpm.overrides['@acme/plugin'], link);
  }
  assert.deepEqual(peerLookups, []);
  fs.rmSync(root, { recursive: true });
});

test('addPlugins adds the peers of an npm plugin that the server does not depend on', () => {
  const { configDirectory, root, targetDir } = setup({
    plugins: [{ name: '@acme/npm-plugin', version: '1.4.1' }],
    serverDependencies: { react: '18.3.1' },
    overrides: { '@lowdefy/helpers': 'link:../packages/utils/helpers' },
  });
  const peerLookups = [];
  addPlugins({
    configDirectory,
    targetDir,
    logger,
    getPeerDependencies: (args) => {
      peerLookups.push(args);
      return { '@lowdefy/helpers': '^7', mongodb: '^6', react: '^18' };
    },
  });
  assert.deepEqual(peerLookups, [
    { cwd: configDirectory, name: '@acme/npm-plugin', version: '1.4.1' },
  ]);
  for (const pkg of readServerPackages(targetDir)) {
    assert.deepEqual(pkg.dependencies, {
      '@acme/npm-plugin': '1.4.1',
      '@lowdefy/helpers': 'link:../packages/utils/helpers',
      mongodb: '^6',
      react: '18.3.1',
    });
  }
  fs.rmSync(root, { recursive: true });
});

test('addPlugins keeps the rewriteDeps link of a workspace:* plugin that is a Lowdefy package', () => {
  const { configDirectory, root, targetDir } = setup({
    plugins: [{ name: '@lowdefy/docs', version: "'workspace:*'" }],
    overrides: { '@lowdefy/docs': 'link:../../../../packages/docs' },
  });
  addPlugins({ configDirectory, targetDir, logger, getPeerDependencies: () => ({}) });
  for (const pkg of readServerPackages(targetDir)) {
    assert.equal(pkg.dependencies['@lowdefy/docs'], 'link:../../../../packages/docs');
    assert.equal(pkg.pnpm.overrides['@lowdefy/docs'], 'link:../../../../packages/docs');
  }
  fs.rmSync(root, { recursive: true });
});
