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

import { type } from '@lowdefy/helpers';

function selectShell({ shells, shellId }) {
  const ids = shells.map((shell) => shell.id);
  if (shells.length === 0) {
    throw new Error(
      'The app declares no phone shells. Add one under "mobile.shells" in lowdefy.yaml.'
    );
  }
  if (type.isNone(shellId)) {
    if (shells.length > 1) {
      throw new Error(
        `The app declares ${shells.length} shells (${ids.join(', ')}). Pick one with --shell <id>.`
      );
    }
    return shells[0];
  }
  const shell = shells.find((candidate) => candidate.id === shellId);
  if (type.isUndefined(shell)) {
    throw new Error(`The app has no shell "${shellId}". Shells: ${ids.join(', ')}.`);
  }
  return shell;
}

function getEnvironmentUrl({ config, environment }) {
  const environments = config.environments ?? {};
  const names = Object.keys(environments).filter((name) => !name.startsWith('~'));
  if (!names.includes(environment)) {
    throw new Error(
      `Environment "${environment}" is not declared in "config.environments". ${
        names.length === 0
          ? 'The app declares none: add each environment with its url.'
          : `Environments: ${names.join(', ')}.`
      }`
    );
  }
  return environments[environment].url;
}

// Reads the shell entry and the environment's URL from the app's build output,
// so a shell is built from the same checked config the server runs.
function getMobileShell({ mobileConfig, config, shellId, environment }) {
  const shell = selectShell({ shells: mobileConfig.shells ?? [], shellId });
  const url = getEnvironmentUrl({ config, environment });
  return { shell, url };
}

export default getMobileShell;
