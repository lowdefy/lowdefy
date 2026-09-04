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

// Runs `check` from @lowdefy/build against this dev server's config in a child
// node process. The dev server directory is already installed, so no install
// is needed — but @lowdefy/build keeps module-level state (the makeId counter
// the JIT page builder relies on for stable ~k keys), and a full check resets
// it, so the check cannot share this process with the running server.
async function runCheck() {
  const serverDirectory = process.cwd();
  const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || serverDirectory;
  let report;
  try {
    const { stdout } = await execFileAsync(process.execPath, [childPath], {
      cwd: serverDirectory,
      env: {
        ...process.env,
        LOWDEFY_DIRECTORY_CONFIG: configDirectory,
        LOWDEFY_DIRECTORY_SERVER: serverDirectory,
      },
      maxBuffer: 64 * 1024 * 1024,
    });
    // A killed child, an exceeded maxBuffer or a stray trailing line all leave
    // stdout without a report; the parse belongs with the run so the caller
    // still gets the report shape it was promised.
    report = JSON.parse(stdout.trim().split('\n').pop());
  } catch (error) {
    return brokenReport(
      `lowdefy check failed to run: ${error.message}${
        error.stderr ? `\n${String(error.stderr).trim()}` : ''
      }`
    );
  }
  return { ok: report.errors.length === 0, ...report };
}

export default runCheck;
