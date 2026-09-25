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
import { type } from '@lowdefy/helpers';

import findDevScripts from '../../utils/findDevScripts.js';
import getLowdefyYaml from '../../utils/getLowdefyYaml.js';

const LOCKFILES = [
  ['pnpm-lock.yaml', 'pnpm'],
  ['yarn.lock', 'yarn'],
  ['package-lock.json', 'npm'],
];

// The nearest lockfile names the package manager; in a monorepo it sits at the
// workspace root, above the app.
function findPackageManager({ configDirectory }) {
  for (
    let directory = configDirectory;
    directory !== path.dirname(directory);
    directory = path.dirname(directory)
  ) {
    const found = LOCKFILES.find(([lockfile]) => fs.existsSync(path.join(directory, lockfile)));
    if (found) {
      return found[1];
    }
  }
  return 'npm';
}

function platformCommand(command) {
  return process.platform === 'win32' ? `${command}.cmd` : command;
}

// The hub runs the command the developer runs, so wrappers around
// `lowdefy dev` (a secrets manager, a workspace filter) apply to agent-started
// servers too. Configuration reaches the CLI through the environment, which
// survives every wrapper where appended arguments do not.
//
// Several scripts often run `lowdefy dev` (with debug logging, against
// production secrets, ...), and guessing between them could start the wrong
// one, so an ambiguous app must name its script in cli.devScript.
async function resolveDevCommand({ configDirectory }) {
  const { cliConfig } = await getLowdefyYaml({ configDirectory, requiresLowdefyYaml: true });
  const { scripts, matching } = findDevScripts({ configDirectory });
  const packageManager = findPackageManager({ configDirectory });

  if (!type.isNone(cliConfig.devScript)) {
    if (!type.isString(cliConfig.devScript) || type.isNone(scripts[cliConfig.devScript])) {
      throw new Error(
        `cli.devScript in lowdefy.yaml names "${
          cliConfig.devScript
        }", which is not a script in ${path.join(configDirectory, 'package.json')}.`
      );
    }
    return {
      args: ['run', cliConfig.devScript],
      command: platformCommand(packageManager),
      display: `${packageManager} run ${cliConfig.devScript}`,
    };
  }

  if (matching.length > 1) {
    throw new Error(
      `Several package.json scripts run "lowdefy dev" (${matching.join(
        ', '
      )}). Set cli.devScript in lowdefy.yaml to the one the dev server should start with.`
    );
  }
  if (matching.length === 1) {
    return {
      args: ['run', matching[0]],
      command: platformCommand(packageManager),
      display: `${packageManager} run ${matching[0]}`,
    };
  }
  return {
    args: ['--no-install', 'lowdefy', 'dev'],
    command: platformCommand('npx'),
    display: 'npx --no-install lowdefy dev',
  };
}

export default resolveDevCommand;
