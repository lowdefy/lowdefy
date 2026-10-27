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
import { readFile } from '@lowdefy/node-utils';

import build from '../build/build.js';
import getMobileShell from './getMobileShell.js';
import getServer from '../../utils/getServer.js';
import loadShellPackage from './loadShellPackage.js';

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

function getProjectDirectory({ context, shell }) {
  return path.join(context.configDirectory, '.lowdefy', 'mobile', shell.id, 'project');
}

// Builds the app, picks the shell entry and copies the published
// @lowdefy/shell at the app's Lowdefy version into the shell's project
// folder, whose profile table and runtime version function are authoritative
// at that version.
async function loadMobileShell({ context }) {
  const environment = context.options.env;
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
  const profile = shellPackage.resolveProfile(shell.profile ?? 'basic');
  return {
    appConfig,
    appMeta,
    environment,
    profile,
    projectDirectory,
    shell,
    shellPackage,
    url,
  };
}

export default loadMobileShell;
