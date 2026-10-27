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
import { vi, afterEach, beforeEach, expect, test } from 'vitest';

import initialBuild from './initialBuild.mjs';

let buildDirectory;
let calls;

function createContext({ installPlugins, skipPluginChecks } = {}) {
  const record = (name, impl) =>
    vi.fn(async () => {
      calls.push(name);
      if (impl) await impl();
    });
  return {
    directories: { build: buildDirectory, server: buildDirectory },
    options: { skipPluginChecks },
    readDotEnv: vi.fn(() => calls.push('readDotEnv')),
    lowdefyBuild: record('lowdefyBuild'),
    checkMockUserWarning: record('checkMockUserWarning'),
    installPlugins: record('installPlugins', installPlugins),
  };
}

beforeEach(() => {
  calls = [];
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-initial-build-'));
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('initialBuild builds once when no plugin checks are pending', async () => {
  const context = createContext();
  await initialBuild(context)();
  expect(context.lowdefyBuild).toHaveBeenCalledTimes(1);
  expect(calls).toEqual(['readDotEnv', 'lowdefyBuild', 'checkMockUserWarning', 'installPlugins']);
});

test('initialBuild installs plugins without building again when plugin checks are pending', async () => {
  const context = createContext({
    installPlugins: () =>
      fs.writeFileSync(
        path.join(buildDirectory, 'plugin-checks-pending.json'),
        JSON.stringify({ packages: [{ name: '@acme/plugin', schemaChecked: true }] })
      ),
  });
  await initialBuild(context)();
  // The first build holds its pending warnings; checkPendingPlugins builds
  // again once the server answers.
  expect(context.lowdefyBuild.mock.calls).toEqual([[{ pluginInstallFollows: true }]]);
  expect(calls).toEqual(['readDotEnv', 'lowdefyBuild', 'checkMockUserWarning', 'installPlugins']);
});
