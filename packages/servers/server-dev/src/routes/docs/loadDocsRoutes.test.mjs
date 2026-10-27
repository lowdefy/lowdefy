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
import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const libDocsDirectory = path.join(serverRoot, 'lib', 'docs') + path.sep;

let vite;
let serverDirectory;

// The dev server loads src/app.js through Vite's SSR graph, so the docs routes
// are loaded that way here too: once statically (as reload.js and the other
// eager routes reach lib/docs) and once through loadDocsRoutes.
beforeAll(async () => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'load-docs-routes-'));
  fs.mkdirSync(path.join(serverDirectory, 'build'));
  fs.writeFileSync(path.join(serverDirectory, 'build', 'config.json'), '{}');
  vi.spyOn(process, 'cwd').mockReturnValue(serverDirectory);
  vite = await createServer({
    root: serverRoot,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
  });
});

afterAll(async () => {
  await vite?.close();
  vi.restoreAllMocks();
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

// Every evaluated lib/docs module, by file, with the module instance Vite holds.
function libDocsInstances() {
  const instances = new Map();
  for (const mod of vite.moduleGraph.idToModuleMap.values()) {
    if (mod.file?.startsWith(libDocsDirectory) && mod.ssrModule) {
      expect(vite.moduleGraph.getModulesByFile(mod.file).size).toBe(1);
      instances.set(mod.file, mod.ssrModule);
    }
  }
  return instances;
}

test('loadDocsRoutes evaluates each lib/docs module once, also after Vite re-evaluates its importers', async () => {
  const tabChannel = await vite.ssrLoadModule('/lib/docs/tabChannel.js');
  const devEventBus = await vite.ssrLoadModule('/lib/docs/devEventBus.js');
  await vite.ssrLoadModule('/src/routes/reload.js');

  const { default: loadDocsRoutes } = await vite.ssrLoadModule(
    '/src/routes/docs/loadDocsRoutes.js'
  );
  const [routes, again] = await Promise.all([loadDocsRoutes(), loadDocsRoutes()]);
  expect(again).toBe(routes);
  expect(Object.keys(routes).sort()).toEqual([
    'buildStatus',
    'events',
    'find',
    'getDocsIndex',
    'index',
    'journey',
    'mcp',
    'mutants',
    'pageConfig',
    'restart',
  ]);

  const before = libDocsInstances();
  expect(before.get(path.join(libDocsDirectory, 'createDocsMcpServer.js'))).toBeDefined();
  expect(before.get(path.join(libDocsDirectory, 'tabChannel.js'))).toBe(tabChannel);
  expect(before.get(path.join(libDocsDirectory, 'devEventBus.js'))).toBe(devEventBus);

  // A change in the server's own graph re-evaluates src/ (app.js, the routes)
  // but keeps the modules it did not touch.
  for (const mod of [...vite.moduleGraph.idToModuleMap.values()]) {
    if (mod.file?.startsWith(path.join(serverRoot, 'src') + path.sep)) {
      vite.moduleGraph.invalidateModule(mod);
    }
  }
  const reloaded = await vite.ssrLoadModule('/src/routes/docs/loadDocsRoutes.js');
  expect(reloaded.default).not.toBe(loadDocsRoutes);
  await reloaded.default();

  const after = libDocsInstances();
  expect([...after.keys()].sort()).toEqual([...before.keys()].sort());
  for (const [file, instance] of before) {
    expect(after.get(file), file).toBe(instance);
  }
});
