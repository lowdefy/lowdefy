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
import { readDevInstance, spawnProcess } from '@lowdefy/node-utils';
import { createStdOutLineHandler } from '@lowdefy/logger/cli';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import ensurePnpmWorkspaceYaml from '../../utils/ensurePnpmWorkspaceYaml.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
}

// `lowdefy data pull <name>`. The pull needs the build, every environment's guards and a MongoDB
// driver, which the installed dev server (.lowdefy/dev) has and the CLI does not, so the CLI hands
// it to the dev server's pull script with the shell's environment and exits with its code.
async function pull({ context, name }) {
  const directory = context.directories.dev;
  // A running dev server owns .lowdefy/dev: use its installation as it is.
  const running = readDevInstance({ configDirectory: context.directories.config });
  if (running === null) {
    await getServer({ context, packageName: '@lowdefy/server-dev', directory });
    await addCustomPluginsAsDeps({ context, directory });
    await ensurePnpmWorkspaceYaml({ context, directory });
    await installServer({ context, directory });
  }
  const script = path.join(directory, 'lib', 'data', 'pullDataSet.mjs');
  if (!fs.existsSync(script)) {
    throw new Error(
      `The dev server installed in ${directory} has no data pull script. Stop the running dev server and run lowdefy data pull again to update it.`
    );
  }

  context.logger.info(`Pulling data set "${name}".`);
  const child = spawnProcess({
    command: process.execPath,
    args: [script, name],
    returnProcess: true,
    stdOutLineHandler: createStdOutLineHandler({ context }),
    processOptions: {
      cwd: directory,
      env: {
        ...process.env,
        LOWDEFY_BUILD_REF_RESOLVER: context.options.refResolver,
        LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
        LOWDEFY_LOG_LEVEL: context.options.logLevel,
      },
    },
  });
  const code = await waitForExit(child);
  context.sendTelemetry();
  process.exitCode = code;
}

export default pull;
