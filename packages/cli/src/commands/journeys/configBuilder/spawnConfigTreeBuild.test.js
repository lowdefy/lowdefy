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

import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { vi, afterAll, afterEach, beforeEach, expect, test } from 'vitest';

const mockSpawnProcess = vi.fn();
vi.doMock('@lowdefy/node-utils', () => ({
  spawnProcess: mockSpawnProcess,
}));

const { default: spawnConfigTreeBuild } = await import('./spawnConfigTreeBuild.js');

const savedSkip = process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
let outDirectory;

function createContext(options) {
  return {
    directories: { dev: '/dev' },
    logger: { debug: vi.fn() },
    options,
  };
}

beforeEach(() => {
  delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  outDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-config-tree-'));
  fs.writeFileSync(
    path.join(outDirectory, 'result.json'),
    JSON.stringify({ status: 'ok', errors: [], warnings: [] })
  );
  mockSpawnProcess.mockReset();
  mockSpawnProcess.mockImplementation(() => {
    const child = new EventEmitter();
    setImmediate(() => child.emit('exit', 0));
    return child;
  });
});

afterEach(() => {
  fs.rmSync(outDirectory, { recursive: true, force: true });
});

afterAll(() => {
  if (savedSkip === undefined) {
    delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  } else {
    process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = savedSkip;
  }
});

test('spawnConfigTreeBuild forwards LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS when skipPluginChecks is set', async () => {
  const result = await spawnConfigTreeBuild({
    context: createContext({ skipPluginChecks: true, refResolver: 'resolver.js' }),
    script: 'builder.mjs',
    configDirectory: '/app',
    outDirectory,
  });
  const { args, processOptions } = mockSpawnProcess.mock.calls[0][0];
  expect(args).toEqual(['builder.mjs', '--config', '/app', '--out', outDirectory]);
  expect(processOptions.cwd).toEqual('/dev');
  expect(processOptions.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS).toEqual('true');
  expect(processOptions.env.LOWDEFY_BUILD_REF_RESOLVER).toEqual('resolver.js');
  expect(result.status).toEqual('ok');
});

test('spawnConfigTreeBuild leaves LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS out when skipPluginChecks is not set', async () => {
  const result = await spawnConfigTreeBuild({
    context: createContext({}),
    script: 'builder.mjs',
    configDirectory: '/app',
    outDirectory,
  });
  const { processOptions } = mockSpawnProcess.mock.calls[0][0];
  expect('LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS' in processOptions.env).toBe(false);
  expect(result.status).toEqual('ok');
});
