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

import path from 'node:path';
import { spawnProcess } from '@lowdefy/node-utils';

const SCRIPT = path.join('scripts', 'createTypeManifest.mjs');

// The line of Node's uncaught error output that holds the message.
function getErrorMessage(lines) {
  return lines.find((line) => /^\w*Error: /.test(line))?.replace(/^\w*Error: /, '');
}

// Runs the copied shell's scripts/createTypeManifest.mjs on the installed
// project, as app.config.ts does at EAS prebuild, so a shell plugin type name
// that clashes with a built-in native type (or another plugin's) is refused
// now, naming the plugin, rather than on EAS.
async function checkShellTypeManifest({ context, projectDirectory, shell }) {
  const stderr = [];
  try {
    await spawnProcess({
      command: process.execPath,
      args: [SCRIPT],
      stdErrLineHandler: (line) => stderr.push(`${line}`),
      processOptions: {
        cwd: projectDirectory,
        env: { ...process.env, LOWDEFY_SHELL_CONFIG: path.join(projectDirectory, 'shell.json') },
      },
    });
  } catch (error) {
    throw new Error(
      `Shell "${shell.id}": ${getErrorMessage(stderr) ?? `${SCRIPT} failed. ${stderr.join('\n')}`}`,
      { cause: error }
    );
  }
  context.logger.debug(`Shell "${shell.id}" type manifest checked.`);
}

export default checkShellTypeManifest;
