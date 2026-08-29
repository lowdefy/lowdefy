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

import fs from 'fs';
import os from 'os';
import path from 'path';

import importPluginModule from './importPluginModule.js';

let tempDirectory;

beforeAll(() => {
  tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-import-plugin-module-'));
});

afterAll(() => {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

test('importPluginModule returns undefined when the module cannot be found', async () => {
  const context = { directories: {} };
  const result = await importPluginModule({
    context,
    specifier: '@lowdefy/this-package-does-not-exist/schemas',
  });
  expect(result).toBe(undefined);
});

test('importPluginModule returns the module when it resolves', async () => {
  const modulePath = path.join(tempDirectory, 'loads.mjs');
  fs.writeFileSync(modulePath, 'export default "loaded";\n');
  const context = { directories: {} };
  const result = await importPluginModule({ context, specifier: modulePath });
  expect(result.default).toBe('loaded');
});

// A module that exists but fails to load is a real fault - swallowing it here
// resurfaces much later as "type X is not defined".
test('importPluginModule rethrows when a resolvable module fails to load', async () => {
  const modulePath = path.join(tempDirectory, 'throws.mjs');
  fs.writeFileSync(modulePath, 'throw new Error("plugin module is broken");\n');
  const context = { directories: {} };
  await expect(importPluginModule({ context, specifier: modulePath })).rejects.toThrow(
    'plugin module is broken'
  );
});

// Every subpath this function imports is optional - a plugin that ships no
// `./schemas` entry in its exports map is the normal case, not a broken plugin.
test('importPluginModule returns undefined when the package does not export the subpath', async () => {
  const serverDir = path.join(tempDirectory, 'server');
  const pkgDir = path.join(serverDir, 'node_modules', '@lowdefy', 'plugin-no-schemas');
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(path.join(serverDir, 'package.json'), '{ "name": "server" }\n');
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({
      name: '@lowdefy/plugin-no-schemas',
      type: 'module',
      exports: { './blocks': './blocks.js' },
    })
  );
  fs.writeFileSync(path.join(pkgDir, 'blocks.js'), 'export default {};\n');
  const context = { directories: { server: serverDir } };
  const result = await importPluginModule({
    context,
    specifier: '@lowdefy/plugin-no-schemas/schemas',
  });
  expect(result).toBe(undefined);
});
