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

// The test shell plugin, @example/lowdefy-printer (fixtures/printer-plugin), installed as a shell
// project would have it: a temporary node_modules that links it. NODE_PATH names that folder, so
// `expo config` and scripts/createTypeManifest.mjs, run with `env`, resolve it from the shell.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'printer-plugin');

export const printerPlugin = { name: '@example/lowdefy-printer', version: '2.1.0' };

/**
 * @param {(installed: { directory: string, env: Object, require: Function }) => any} callback
 *   `directory` is a temporary folder for the test's own files, `require` resolves from it.
 */
export async function withPrinterPlugin(callback) {
  // The real path: scripts run by app.config.ts compare their own path with the one they were
  // started with, and macOS's temporary directory is behind a symlink.
  const directory = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-shell-plugin-')
  );
  const nodeModules = path.join(directory, 'node_modules');
  fs.mkdirSync(path.join(nodeModules, '@example'), { recursive: true });
  fs.symlinkSync(fixtureRoot, path.join(nodeModules, '@example', 'lowdefy-printer'), 'dir');
  try {
    return await callback({
      directory,
      env: { ...process.env, NODE_PATH: nodeModules },
      require: createRequire(path.join(directory, 'package.json')),
    });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
