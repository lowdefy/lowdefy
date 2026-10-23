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
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const childPath = fileURLToPath(new URL('./runCheckChild.js', import.meta.url));

// Reports must be readable by an agent even when the check itself broke, so
// the report shape always comes back; a broken run is one unlocated error.
function brokenReport(message) {
  return {
    ok: false,
    errors: [
      {
        message,
        name: 'LowdefyInternalError',
        source: null,
        config: null,
        configKey: null,
        checkSlug: null,
        prodError: false,
      },
    ],
    warnings: [],
  };
}

function readBuildFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    // build/invalidatePages is absent until the first watched change.
    return null;
  }
}

// What a check run must have seen to answer a later call: the last config
// build (buildStatus.json) and the manager's count of watched-file changes
// since (build/invalidatePages, rewritten on every batch of changes).
function readBuildSignature({ serverDirectory }) {
  const buildDirectory = path.join(serverDirectory, 'build');
  return JSON.stringify([
    readBuildFile(path.join(buildDirectory, 'buildStatus.json')),
    readBuildFile(path.join(buildDirectory, 'invalidatePages')),
  ]);
}

// The run in flight, { signature, promise }, or null. No report outlives its
// run: lowdefy_check is how an agent confirms a production build, and no key
// sees every edit (unvisited pages, app code), so a kept report could pass a
// broken app.
let currentRun = null;

// Runs `check` from @lowdefy/build against this dev server's config in a child
// node process. The dev server directory is already installed, so no install
// is needed — but @lowdefy/build keeps module-level state (the makeId counter
// the JIT page builder relies on for stable ~k keys), and a full check resets
// it, so the check cannot share this process with the running server.
async function spawnCheck({ serverDirectory }) {
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || serverDirectory;
  let stdout;
  try {
    ({ stdout } = await execFileAsync(process.execPath, [childPath], {
      cwd: serverDirectory,
      env: {
        ...process.env,
        LOWDEFY_DIRECTORY_CONFIG: configDirectory,
        LOWDEFY_DIRECTORY_SERVER: serverDirectory,
      },
      maxBuffer: 64 * 1024 * 1024,
    }));
  } catch (error) {
    return brokenReport(
      `lowdefy check failed to run: ${error.message}${
        error.stderr ? `\n${String(error.stderr).trim()}` : ''
      }`
    );
  }
  const lastLine = stdout.trim().split('\n').pop();
  const report = JSON.parse(lastLine);
  return { ok: report.errors.length === 0, ...report };
}

// A call made while a check runs joins it when the build it would check is the
// one that run started on, so two checks fired at once start one child. A call
// made after an edit starts a run of its own.
function runCheck() {
  const serverDirectory = process.cwd();
  const signature = readBuildSignature({ serverDirectory });
  if (currentRun !== null && currentRun.signature === signature) {
    return currentRun.promise;
  }
  const run = { signature, promise: null };
  run.promise = spawnCheck({ serverDirectory }).finally(() => {
    if (currentRun === run) {
      currentRun = null;
    }
  });
  currentRun = run;
  return run.promise;
}

export default runCheck;
