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
import { readFile, writeFileIfChanged } from '@lowdefy/node-utils';

import build from '../build/build.js';
import createEasJson from './createEasJson.js';
import createShellJson from './createShellJson.js';
import getMobileShell from './getMobileShell.js';
import getServer from '../../utils/getServer.js';
import installShellProject from './installShellProject.js';
import loadShellPackage from './loadShellPackage.js';
import writeShellWorkspace from './writeShellWorkspace.js';

const SHELL_PACKAGE = '@lowdefy/shell';

async function readBuildArtifact({ context, filePath }) {
  return JSON.parse(await readFile(path.join(context.directories.build, filePath)));
}

// The app's own build checks the shell entry and resolves the environments.
// It is built for the shell's environment, so a declared environment that is
// not this deployment's still builds. The phone serves no web client, so the
// client build is skipped.
async function buildApp({ context, environment }) {
  process.env.LOWDEFY_ENVIRONMENT = environment;
  await build({ context: { ...context, options: { ...context.options, clientBuild: false } } });
  return {
    appMeta: await readBuildArtifact({ context, filePath: 'appMeta.json' }),
    config: await readBuildArtifact({ context, filePath: 'config.json' }),
    mobileConfig: await readBuildArtifact({ context, filePath: 'mobile/config.json' }),
  };
}

function getEnvironmentNames(config) {
  return Object.keys(config.environments ?? {}).filter((name) => !name.startsWith('~'));
}

function getProjectDirectory({ context, shell }) {
  return path.join(context.configDirectory, '.lowdefy', 'mobile', shell.id, 'project');
}

async function writeJson({ filePath, value }) {
  await writeFileIfChanged(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

// Writes the shell's Expo project to .lowdefy/mobile/<shell>/project: a copy
// of the published @lowdefy/shell at the app's Lowdefy version, with its own
// install, plus shell.json, eas.json and the icon. Every EAS command runs
// from there. Returns what the other lowdefy mobile commands build on.
async function config({ context }) {
  const environment = context.options.env;
  const dryRun = context.options.dryRun === true;
  if (context.lowdefyVersion === 'local') {
    throw new Error(
      'lowdefy mobile copies the published @lowdefy/shell at the app\'s Lowdefy version, and this app\'s version is "local". Set "lowdefy" in lowdefy.yaml to a published version.'
    );
  }
  const { appMeta, config: appConfig, mobileConfig } = await buildApp({ context, environment });
  const { shell, url } = getMobileShell({
    mobileConfig,
    config: appConfig,
    shellId: context.options.shell,
    environment,
  });
  const projectDirectory = getProjectDirectory({ context, shell });
  await getServer({ context, packageName: SHELL_PACKAGE, directory: projectDirectory });
  const shellPackage = loadShellPackage({ projectDirectory });
  // A shell.json without a profile is a basic shell, as @lowdefy/shell reads it.
  const profile = shell.profile ?? 'basic';
  const { capabilities } = shellPackage.resolveProfile(profile);
  const shellJson = createShellJson({
    appMeta,
    capabilities,
    environment,
    profile,
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
    profile,
    plugins: [],
  });
  context.logger.info(
    `Shell "${shell.id}" for ${environment} written to ${projectDirectory}: @lowdefy/shell@${shellPackage.version}, profile ${profile}, runtime version ${runtimeVersion}.`
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
