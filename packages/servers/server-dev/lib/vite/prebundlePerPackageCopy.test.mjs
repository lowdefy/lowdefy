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
import { createServer, optimizeDeps, resolveConfig } from 'vite';

import prebundlePerPackageCopy from './prebundlePerPackageCopy.js';

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-prebundle-copy-')));

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function writePackage(packageDir, name, version, { exports, subpaths = [] } = {}) {
  writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify({ name, version, type: 'module', main: 'index.js', exports })
  );
  for (const file of ['index.js', ...subpaths]) {
    writeFile(path.join(packageDir, file), `export const version = '${name}@${version}';\n`);
  }
}

function installPackage(dir, name, version, options) {
  writePackage(path.join(dir, 'node_modules', name), name, version, options);
}

// pnpm installs `"<alias>": "npm:<name>@<version>"` in its store under the real name and links
// it into node_modules under the alias.
function installAlias(dir, alias, name, version) {
  const packageDir = path.join(
    dir,
    'node_modules',
    '.pnpm',
    `${name}@${version}`,
    'node_modules',
    name
  );
  writePackage(packageDir, name, version);
  fs.symlinkSync(packageDir, path.join(dir, 'node_modules', alias), 'dir');
}

function writeSourceFile(file, imports) {
  writeFile(
    file,
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
//   markdown: the server has 10.1.0, whose exports hold only its main file; the plugin pins
//             8.0.7 and also imports markdown/extra.js from it.
//   lib:      the server has none; the block and the plugin each install their own.
//   shared:   the server has 1.0.0 and dedupes it; the plugin installs 2.0.0.
//   common:   the server has none; the block and the plugin share one installed copy.
//   aliased:  the server has aliased 1.0.0; the plugin installs fork 2.0.0 under that name.
//   @scope/late/sub.js: only the plugin's late.js imports it, which nothing the scan crawls
//             imports, so the dev server meets it only when it is requested.
function writeFixture({ name, pluginFirst }) {
  const root = path.join(tmp, name);
  installPackage(root, 'markdown', '10.1.0', { exports: { '.': './index.js' } });
  installPackage(root, 'shared', '1.0.0');
  installPackage(root, 'aliased', '1.0.0');
  installPackage(path.join(root, 'packages'), 'common', '3.0.0');

  const block = path.join(root, 'packages', 'block');
  installPackage(block, 'lib', '1.0.0');
  writeSourceFile(path.join(block, 'index.js'), ['markdown', 'lib', 'shared', 'common', 'aliased']);

  const plugin = path.join(root, 'packages', 'plugin');
  installPackage(plugin, 'markdown', '8.0.7', { subpaths: ['extra.js'] });
  installPackage(plugin, 'lib', '2.0.0');
  installPackage(plugin, 'shared', '2.0.0');
  installPackage(plugin, '@scope/late', '1.0.0', { subpaths: ['sub.js'] });
  installAlias(plugin, 'aliased', 'fork', '2.0.0');
  writeSourceFile(path.join(plugin, 'index.js'), [
    'markdown',
    'markdown/extra.js',
    'lib',
    'shared',
    'common',
    'aliased',
  ]);
  writeSourceFile(path.join(plugin, 'late.js'), ['@scope/late/sub.js']);

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
    versions.push(dep.code.match(/"((?:@[\w-]+\/)?[\w-]+@[\d.]+)"/)[1]);
  }
  return versions;
}

function viteConfig(root) {
  // A new instance per Vite process, as each process loads vite.config.js afresh.
  const packageCopies = prebundlePerPackageCopy();
  return {
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
  };
}

async function startServer(root, { optimizeFirst }) {
  if (optimizeFirst) {
    // The dev manager runs `vite optimize` in a process of its own before it starts Vite, so
    // the dev server starts on a warm cache and never scans.
    await optimizeDeps(await resolveConfig(viteConfig(root), 'serve'), true, true);
  }
  const server = await createServer(viteConfig(root));
  await server.environments.client.listen(server);
  return server;
}

// The scan meets the importers in either order; each order must serve each importer its own
// copy, whether the dev server scans or `vite optimize` scanned before it started.
test.each([
  { name: 'block-first', pluginFirst: false, optimizeFirst: false },
  { name: 'plugin-first', pluginFirst: true, optimizeFirst: false },
  { name: 'optimize-block-first', pluginFirst: false, optimizeFirst: true },
  { name: 'optimize-plugin-first', pluginFirst: true, optimizeFirst: true },
])('each importer is served its own copy of a package ($name)', async (options) => {
  const root = writeFixture(options);
  const server = await startServer(root, options);
  try {
    const environment = server.environments.client;
    await environment.depsOptimizer.scanProcessing;
    const { metadata } = environment.depsOptimizer;
    const scannedIds = Object.keys({ ...metadata.optimized, ...metadata.discovered }).sort();

    expect(await servedVersions(environment, '/packages/block/index.js')).toEqual([
      'markdown@10.1.0',
      'lib@1.0.0',
      'shared@1.0.0',
      'common@3.0.0',
      'aliased@1.0.0',
    ]);
    expect(await servedVersions(environment, '/packages/plugin/index.js')).toEqual([
      'markdown@8.0.7',
      'markdown@8.0.7',
      'lib@2.0.0',
      'shared@1.0.0',
      'common@3.0.0',
      'fork@2.0.0',
    ]);

    // The scan found every copy: serving discovered none, so no page reloads to take one in.
    const ids = Object.keys(environment.depsOptimizer.metadata.optimized).sort();
    expect(ids).toEqual(scannedIds);
    // The server's copy keeps its plain id, a dedupe package stays single, and a copy two
    // importers share is pre-bundled once.
    expect(ids.filter((id) => !id.includes(' > '))).toEqual(['aliased', 'markdown', 'shared']);
    expect(ids.filter((id) => id.endsWith(' > markdown'))).toHaveLength(1);
    expect(ids.filter((id) => id.endsWith(' > lib'))).toHaveLength(2);
    expect(ids.filter((id) => id.endsWith(' > common'))).toHaveLength(1);
    expect(ids.filter((id) => id.endsWith(' > shared'))).toHaveLength(0);
    expect(ids.filter((id) => id.startsWith('fork@2.0.0-'))).toHaveLength(1);
    expect(ids.filter((id) => id.endsWith(' > markdown/extra.js'))).toHaveLength(1);

    // A copy the scan never met is pre-bundled when it is first requested.
    expect(await servedVersions(environment, '/packages/plugin/late.js')).toEqual([
      '@scope/late@1.0.0',
    ]);
    expect(
      Object.keys(environment.depsOptimizer.metadata.optimized).filter((id) =>
        id.startsWith('@scope/late@1.0.0-')
      )
    ).toEqual([expect.stringMatching(/ > @scope\/late\/sub\.js$/)]);
  } finally {
    await server.close();
  }
});
