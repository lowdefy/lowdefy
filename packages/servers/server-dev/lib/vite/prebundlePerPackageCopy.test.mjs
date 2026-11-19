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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, expect, test } from 'vitest';
import { createServer } from 'vite';

import prebundlePerPackageCopy from './prebundlePerPackageCopy.js';

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-prebundle-copy-')));

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function installPackage(dir, name, version) {
  const packageDir = path.join(dir, 'node_modules', name);
  writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify({ name, version, type: 'module', main: 'index.js' })
  );
  writeFile(path.join(packageDir, 'index.js'), `export const version = '${name}@${version}';\n`);
}

function writeSourcePackage(dir, imports) {
  writeFile(
    path.join(dir, 'index.js'),
    [
      ...imports.map((name, i) => `import { version as v${i} } from '${name}';`),
      `export const versions = [${imports.map((_, i) => `v${i}`).join(', ')}];`,
      '',
    ].join('\n')
  );
}

// A server directory with two source packages, as a Lowdefy block package of a Lowdefy
// checkout and a linked app plugin are: Vite serves both from source, so the optimiser
// pre-bundles their bare imports.
//   markdown: the server has 10.1.0; the plugin pins 8.0.7.
//   lib:      the server has none; the block and the plugin each install their own.
//   shared:   the server has 1.0.0 and dedupes it; the plugin installs 2.0.0.
//   common:   the server has none; the block and the plugin share one installed copy.
function writeFixture({ name, pluginFirst }) {
  const root = path.join(tmp, name);
  installPackage(root, 'markdown', '10.1.0');
  installPackage(root, 'shared', '1.0.0');
  installPackage(path.join(root, 'packages'), 'common', '3.0.0');

  const block = path.join(root, 'packages', 'block');
  installPackage(block, 'lib', '1.0.0');
  writeSourcePackage(block, ['markdown', 'lib', 'shared', 'common']);

  const plugin = path.join(root, 'packages', 'plugin');
  installPackage(plugin, 'markdown', '8.0.7');
  installPackage(plugin, 'lib', '2.0.0');
  installPackage(plugin, 'shared', '2.0.0');
  writeSourcePackage(plugin, ['markdown', 'lib', 'shared', 'common']);

  const importers = pluginFirst ? ['plugin', 'block'] : ['block', 'plugin'];
  writeFile(
    path.join(root, 'main.js'),
    importers.map((importer) => `import './packages/${importer}/index.js';`).join('\n')
  );
  return root;
}

// The versions each import of the source package's index.js is served, following each import
// to the pre-bundled module the dev server serves for it.
async function servedVersions(environment, url) {
  const { code } = await environment.transformRequest(url);
  const depUrls = [...code.matchAll(/from "([^"]*\/\.vite\/deps\/[^"]+)"/g)].map(
    (match) => match[1]
  );
  const versions = [];
  for (const depUrl of depUrls) {
    const dep = await environment.transformRequest(depUrl);
    versions.push(dep.code.match(/"([\w-]+@[\d.]+)"/)[1]);
  }
  return versions;
}

async function startServer(root) {
  const packageCopies = prebundlePerPackageCopy();
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    cacheDir: path.join(root, '.vite'),
    plugins: [packageCopies.plugin],
    resolve: { dedupe: ['shared'] },
    optimizeDeps: {
      entries: ['main.js'],
      rolldownOptions: { plugins: [packageCopies.scanPlugin] },
    },
    server: { middlewareMode: true, ws: false },
  });
  await server.environments.client.listen(server);
  return server;
}

// The scan meets the importers in either order; each order must serve each importer its own copy.
test.each([
  { name: 'block-first', pluginFirst: false },
  { name: 'plugin-first', pluginFirst: true },
])('each importer is served its own copy of a package ($name)', async ({ name, pluginFirst }) => {
  const root = writeFixture({ name, pluginFirst });
  const server = await startServer(root);
  try {
    const environment = server.environments.client;
    expect(await servedVersions(environment, '/packages/block/index.js')).toEqual([
      'markdown@10.1.0',
      'lib@1.0.0',
      'shared@1.0.0',
      'common@3.0.0',
    ]);
    expect(await servedVersions(environment, '/packages/plugin/index.js')).toEqual([
      'markdown@8.0.7',
      'lib@2.0.0',
      'shared@1.0.0',
      'common@3.0.0',
    ]);

    // The server's copy keeps its plain id, a dedupe package stays single, and a copy two
    // importers share is pre-bundled once.
    const { optimized } = environment.depsOptimizer.metadata;
    const ids = Object.keys(optimized).sort();
    expect(ids.filter((id) => !id.includes(' > '))).toEqual(['markdown', 'shared']);
    expect(ids.filter((id) => id.endsWith(' > markdown'))).toHaveLength(1);
    expect(ids.filter((id) => id.endsWith(' > lib'))).toHaveLength(2);
    expect(ids.filter((id) => id.endsWith(' > common'))).toHaveLength(1);
    expect(ids.filter((id) => id.endsWith(' > shared'))).toHaveLength(0);
  } finally {
    await server.close();
  }
});
