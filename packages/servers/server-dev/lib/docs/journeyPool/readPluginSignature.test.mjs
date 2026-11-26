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

import { afterEach, expect, test } from 'vitest';

import readPluginSignature from './readPluginSignature.js';

const directories = [];

function writeBuild(files) {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-signature-'));
  directories.push(buildDirectory);
  Object.entries(files).forEach(([name, content]) => {
    const filePath = path.join(buildDirectory, 'plugins', name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  });
  return buildDirectory;
}

afterEach(() => {
  directories.splice(0).forEach((directory) => fs.rmSync(directory, { recursive: true }));
});

test('readPluginSignature changes when a plugin file the server imports is rewritten', () => {
  const buildDirectory = writeBuild({
    'steps.js': 'export default {};',
    'operators/server.js': 'export default {};',
  });
  const before = readPluginSignature({ buildDirectory });
  fs.writeFileSync(path.join(buildDirectory, 'plugins', 'steps.js'), 'export default { a: 1 };');
  expect(readPluginSignature({ buildDirectory })).not.toBe(before);
});

// A page build that adds _js rewrites both maps, and a thread reads them fresh.
test('readPluginSignature stays the same when only the _js maps are rewritten', () => {
  const buildDirectory = writeBuild({
    'steps.js': 'export default {};',
    'operators/serverJsMap.js': 'export default {};',
    'operators/clientJsMap.js': 'export default {};',
  });
  const before = readPluginSignature({ buildDirectory });
  fs.writeFileSync(
    path.join(buildDirectory, 'plugins', 'operators', 'serverJsMap.js'),
    'export default { h: 1 };'
  );
  fs.writeFileSync(
    path.join(buildDirectory, 'plugins', 'operators', 'clientJsMap.js'),
    'export default { h: 1 };'
  );
  expect(readPluginSignature({ buildDirectory })).toBe(before);
});

test('readPluginSignature is empty for a build with no plugins folder', () => {
  const buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-signature-'));
  directories.push(buildDirectory);
  expect(readPluginSignature({ buildDirectory })).toBe('');
});
