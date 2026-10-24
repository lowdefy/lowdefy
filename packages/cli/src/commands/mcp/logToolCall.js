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

import formatInstanceLabel from './formatInstanceLabel.js';
import getLowdefyHome from '../../utils/getLowdefyHome.js';
import resolveApp from './resolveApp.js';

const LOG_FILE = 'tool-calls.jsonl';
const MAX_LOG_BYTES = 1024 * 1024;

// The app a call meant, as the shim labels it; null when it cannot be told
// (a lifecycle tool that lists the checkout, or a directory that is no app).
function appLabel({ directory, cwd }) {
  try {
    return formatInstanceLabel(resolveApp({ directory, cwd }));
  } catch {
    return null;
  }
}

// Appends one line per MCP tool call to tool-calls.jsonl in the Lowdefy home:
// the tool, the app, when it ran, how long it took and whether it worked. No
// arguments and no results, and nothing leaves the machine. One file serves
// every checkout; it rolls over at 1 MB, keeping one old file. Logging never
// fails a call.
async function logToolCall({ name, directory, cwd, startedAt, ok }) {
  try {
    const file = path.join(getLowdefyHome(), LOG_FILE);
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    try {
      const { size } = await fs.promises.stat(file);
      if (size >= MAX_LOG_BYTES) {
        await fs.promises.rename(file, `${file}.1`);
      }
    } catch {
      // No log yet.
    }
    const line = {
      tool: name,
      app: appLabel({ directory, cwd }),
      ts: new Date(startedAt).toISOString(),
      ms: Date.now() - startedAt,
      ok,
    };
    await fs.promises.appendFile(file, `${JSON.stringify(line)}\n`);
  } catch {
    // The log is a convenience; a read-only home must not break tools.
  }
}

export { LOG_FILE, MAX_LOG_BYTES };
export default logToolCall;
