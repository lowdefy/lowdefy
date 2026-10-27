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

import pluginChecksNeedRebuild from './pluginChecksNeedRebuild.js';
import { afterEach, beforeEach, expect, test } from 'vitest';

let serverDirectory;
let buildDirectory;

beforeEach(() => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-plugin-checks-rebuild-'));
  buildDirectory = path.join(serverDirectory, 'build');
  fs.mkdirSync(buildDirectory);
  fs.writeFileSync(path.join(serverDirectory, 'package.json'), '{ "name": "server" }\n');
});

afterEach(() => {
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

function writePending(packages) {
  fs.writeFileSync(
    path.join(buildDirectory, 'plugin-checks-pending.json'),
    JSON.stringify({ packages })
  );
}

function installPackage(name, { checks }) {
  const pkgDir = path.join(serverDirectory, 'node_modules', name);
  fs.mkdirSync(pkgDir, { recursive: true });
  const exports = { './types': './types.js' };
  fs.writeFileSync(path.join(pkgDir, 'types.js'), 'export default {};\n');
  if (checks) {
    exports['./checks'] = './checks.js';
    fs.writeFileSync(path.join(pkgDir, 'checks.js'), 'export default {};\n');
  }
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify({ name, exports }));
}

test('pluginChecksNeedRebuild is false when no plugin checks are pending', () => {
  expect(pluginChecksNeedRebuild({ buildDirectory, serverDirectory })).toBe(false);
});

test('pluginChecksNeedRebuild is true when a pending package owns a schema-checked type', () => {
  writePending([{ name: '@acme/blocks', schemaChecked: true }]);
  expect(pluginChecksNeedRebuild({ buildDirectory, serverDirectory })).toBe(true);
});

test('pluginChecksNeedRebuild is false for an installed connection package with no ./checks', () => {
  installPackage('@acme/connection', { checks: false });
  writePending([{ name: '@acme/connection', schemaChecked: false }]);
  expect(pluginChecksNeedRebuild({ buildDirectory, serverDirectory })).toBe(false);
});

test('pluginChecksNeedRebuild is true once the install gives a pending package a ./checks export', () => {
  installPackage('@acme/connection', { checks: true });
  writePending([{ name: '@acme/connection', schemaChecked: false }]);
  expect(pluginChecksNeedRebuild({ buildDirectory, serverDirectory })).toBe(true);
});
