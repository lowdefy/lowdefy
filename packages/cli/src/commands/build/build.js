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

import path from 'path';

import { pluginChecksNeedRebuild } from '@lowdefy/node-utils';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import ensurePnpmWorkspaceYaml from '../../utils/ensurePnpmWorkspaceYaml.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runLowdefyBuild from '../../utils/runLowdefyBuild.js';
import runClientBuild from '../../utils/runClientBuild.js';

const serverPackages = {
  e2e: '@lowdefy/server-e2e',
};

async function build({ context }) {
  context.logger.info('Starting build.');

  const directory = context.directories.server;
  const packageName = serverPackages[context.options.server] ?? '@lowdefy/server';

  await getServer({ context, packageName, directory });
  await resetServerPackageJson({ context, directory });
  await addCustomPluginsAsDeps({ context, directory });
  await ensurePnpmWorkspaceYaml({ context, directory });
  await installServer({ context, directory });
  // This build holds its warnings for plugins it could not check: the install
  // below adds them, and the build after it warns for any still missing.
  await runLowdefyBuild({ context, directory, pluginInstallFollows: true });
  await installServer({ context, directory });
  // The build lists the plugins it used but could not check, since they were
  // not installed. The install above added them, so build once more when that
  // checks something new, unless no checks run this time anyway.
  if (
    !context.options.skipPluginChecks &&
    pluginChecksNeedRebuild({
      buildDirectory: path.join(directory, 'build'),
      serverDirectory: directory,
    })
  ) {
    context.logger.info('Building again to run the checks of newly installed plugins.');
    await runLowdefyBuild({ context, directory });
  }
  if (context.options.clientBuild !== false && context.options.nextBuild !== false) {
    await runClientBuild({ context, directory });
  }
  await context.sendTelemetry({ sendTypes: true });
  context.logger.info({ spin: 'succeed' }, 'Build successful.');
}

export default build;
