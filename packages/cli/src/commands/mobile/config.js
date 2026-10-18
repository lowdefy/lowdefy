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

import fs from 'node:fs';
import path from 'node:path';
import { type } from '@lowdefy/helpers';
import { writeFileIfChanged } from '@lowdefy/node-utils';

import createEasJson from './createEasJson.js';
import createShellJson from './createShellJson.js';
import installShellProject from './installShellProject.js';
import loadMobileShell from './loadMobileShell.js';
import writeShellWorkspace from './writeShellWorkspace.js';

function getEnvironmentNames(config) {
  return Object.keys(config.environments ?? {}).filter((name) => !name.startsWith('~'));
}

async function writeJson({ filePath, value }) {
  await writeFileIfChanged(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

// Writes the shell's Expo project to .lowdefy/mobile/<shell>/project: a copy
// of the published @lowdefy/shell at the app's Lowdefy version, with its own
// install, plus shell.json, eas.json and the icon. Every EAS command runs
// from there. Returns what the other lowdefy mobile commands build on.
async function config({ context }) {
  const dryRun = context.options.dryRun === true;
  const { appConfig, appMeta, environment, profile, projectDirectory, shell, shellPackage, url } =
    await loadMobileShell({ context });
  const { capabilities } = profile;
  const shellJson = createShellJson({
    appMeta,
    capabilities,
    environment,
    profile: profile.name,
    shell,
    url,
  });
  await writeJson({ filePath: path.join(projectDirectory, 'shell.json'), value: shellJson });
  await writeJson({
    filePath: path.join(projectDirectory, 'eas.json'),
    value: createEasJson({ environments: getEnvironmentNames(appConfig) }),
  });
  if (type.isString(shell.icon)) {
    await fs.promises.copyFile(shell.icon, path.join(projectDirectory, 'icon.png'));
  }
  await writeShellWorkspace({ context, directory: projectDirectory });
  await installShellProject({ context, directory: projectDirectory, dryRun });
  const runtimeVersion = shellPackage.getRuntimeVersion({
    nativeVersion: shellPackage.nativeVersion,
    profile: profile.name,
    // How an app declares shell plugins in lowdefy.yaml is not designed yet.
    plugins: [],
  });
  context.logger.info(
    `Shell "${shell.id}" for ${environment} written to ${projectDirectory}: @lowdefy/shell@${shellPackage.version}, profile ${profile.name}, runtime version ${runtimeVersion}.`
  );
  return {
    environment,
    projectDirectory,
    runtimeVersion,
    shell,
    shellJson,
    shellVersion: shellPackage.version,
  };
}

export default config;
