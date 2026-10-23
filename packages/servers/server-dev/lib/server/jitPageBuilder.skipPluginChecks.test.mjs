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
import { vi, afterAll, afterEach, beforeEach, expect, test } from 'vitest';

const actualBuildDev = await import('@lowdefy/build/dev');
const mockCreateContext = vi.fn(actualBuildDev.createContext);

vi.doMock('@lowdefy/build/dev', () => ({
  ...actualBuildDev,
  createContext: mockCreateContext,
}));

const savedSkip = process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
let root;

// The build context is kept at module scope, so each case loads a fresh
// module instance.
async function createBuildContext() {
  vi.resetModules();
  const { getBuildContext } = await import('./jitPageBuilder.js');
  return getBuildContext(path.join(root, 'build'), path.join(root, 'config'));
}

beforeEach(() => {
  delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  mockCreateContext.mockClear();
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'ldf-jit-skip-checks-'));
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'build', 'idCounter.json'),
    JSON.stringify({ prefix: 'test_', counter: 0 })
  );
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

afterAll(() => {
  if (savedSkip === undefined) {
    delete process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS;
  } else {
    process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = savedSkip;
  }
});

test('the JIT build context skips plugin checks when LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS is true', async () => {
  process.env.LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS = 'true';
  const context = await createBuildContext();
  expect(mockCreateContext).toHaveBeenCalledTimes(1);
  expect(mockCreateContext.mock.calls[0][0].skipPluginChecks).toBe(true);
  expect(context.skipPluginChecks).toBe(true);
});

test('the JIT build context runs plugin checks when LOWDEFY_BUILD_SKIP_PLUGIN_CHECKS is unset', async () => {
  const context = await createBuildContext();
  expect(mockCreateContext).toHaveBeenCalledTimes(1);
  expect(mockCreateContext.mock.calls[0][0].skipPluginChecks).toBe(false);
  expect(context.skipPluginChecks).toBe(false);
});
