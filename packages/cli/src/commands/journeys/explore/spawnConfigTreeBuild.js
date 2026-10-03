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
import { spawnProcess } from '@lowdefy/node-utils';

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
}

function readResult({ outDirectory, code }) {
  const resultPath = path.join(outDirectory, 'result.json');
  if (!fs.existsSync(resultPath)) {
    return {
      status: 'error',
      errors: [{ message: `The config builder exited with code ${code} and wrote no result.` }],
      warnings: [],
    };
  }
  return JSON.parse(fs.readFileSync(resultPath, 'utf8'));
}

// One full config build, run by the installed dev server's builder script,
// which holds @lowdefy/build and the app's plugins (the CLI has neither).
// The builder's log goes to the CLI's debug log; the result is read from the
// <out>/result.json it writes.
async function spawnConfigTreeBuild({ context, script, configDirectory, outDirectory }) {
  const env = { ...process.env };
  if (context.options.refResolver) env.LOWDEFY_BUILD_REF_RESOLVER = context.options.refResolver;
  if (context.options.logLevel) env.LOWDEFY_LOG_LEVEL = context.options.logLevel;
  const start = Date.now();
  const child = spawnProcess({
    command: process.execPath,
    args: [script, '--config', configDirectory, '--out', outDirectory],
    returnProcess: true,
    stdOutLineHandler: (line) => context.logger.debug(line),
    processOptions: { cwd: context.directories.dev, env },
  });
  const code = await waitForExit(child);
  return { ...readResult({ outDirectory, code }), ms: Date.now() - start };
}

export default spawnConfigTreeBuild;
