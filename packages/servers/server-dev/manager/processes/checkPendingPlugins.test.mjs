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

import checkPendingPlugins from './checkPendingPlugins.mjs';

let buildDirectory;
let calls;

function createContext({ lowdefyBuild, skipPluginChecks } = {}) {
  const record = (name, impl) =>
    vi.fn(async () => {
      calls.push(name);
      if (impl) await impl();
    });
  return {
    buildActivity: {
      track: vi.fn(async (task) => {
        calls.push('busy');
        try {
          return await task();
        } finally {
          calls.push('idle');
        }
      }),
    },
    directories: { build: buildDirectory, server: buildDirectory },
    logger: { info: vi.fn() },
    options: { skipPluginChecks },
    lowdefyBuild: record('lowdefyBuild', lowdefyBuild),
    reloadClients: record('reloadClients'),
    syncServer: record('syncServer'),
  };
}

function writePending(packages) {
  fs.writeFileSync(
    path.join(buildDirectory, 'plugin-checks-pending.json'),
    JSON.stringify({ packages })
  );
}

beforeEach(() => {
  calls = [];
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-check-pending-plugins-'));
});

afterEach(() => {
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('checkPendingPlugins does nothing when no plugin checks are pending', async () => {
  const context = createContext();
  await checkPendingPlugins(context)();
  expect(calls).toEqual([]);
});

test('checkPendingPlugins builds, syncs and reloads as one tracked change when checks are pending', async () => {
  writePending([{ name: '@acme/plugin', schemaChecked: true }]);
  const context = createContext();
  await checkPendingPlugins(context)();
  // Warnings held by the initial build are given by this one, so it passes no options.
  expect(context.lowdefyBuild.mock.calls).toEqual([[]]);
  expect(calls).toEqual(['busy', 'lowdefyBuild', 'syncServer', 'reloadClients', 'idle']);
});

test('checkPendingPlugins still syncs and reloads when the build fails', async () => {
  writePending([{ name: '@acme/plugin', schemaChecked: true }]);
  const context = createContext({
    lowdefyBuild: () => {
      throw new Error('Build failed with 1 error(s).');
    },
  });
  await expect(checkPendingPlugins(context)()).rejects.toThrow('Build failed with 1 error(s).');
  expect(calls).toEqual(['busy', 'lowdefyBuild', 'syncServer', 'reloadClients', 'idle']);
});

test('checkPendingPlugins does nothing with skipPluginChecks, even when checks are pending', async () => {
  writePending([{ name: '@acme/plugin', schemaChecked: true }]);
  const context = createContext({ skipPluginChecks: true });
  await checkPendingPlugins(context)();
  expect(calls).toEqual([]);
});

test('checkPendingPlugins does nothing when the pending plugins give nothing new to check', async () => {
  writePending([{ name: '@acme/connection-only', schemaChecked: false }]);
  const context = createContext();
  await checkPendingPlugins(context)();
  expect(calls).toEqual([]);
});
