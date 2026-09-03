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
import { resolveMigrationStage } from '@lowdefy/node-utils';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import buildScriptArgs from './buildScriptArgs.js';
import confirmMigrate from './confirmMigrate.js';
import readMigrationPlan from './readMigrationPlan.js';
import ensurePnpmWorkspaceYaml from '../../utils/ensurePnpmWorkspaceYaml.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runLowdefyMigrate from '../../utils/runLowdefyMigrate.js';

// Migrations run against build artifacts (the ordered index and one routine per
// migration) the same server the migrate script imports, so the app must be
// built first. The server directory is prepared the same way build/check do it,
// once on a fresh clone.
async function prepareServer({ context, directory }) {
  await getServer({ context, packageName: '@lowdefy/server', directory });
  await resetServerPackageJson({ context, directory });
  await addCustomPluginsAsDeps({ context, directory });
  await ensurePnpmWorkspaceYaml({ context, directory });
  await installServer({ context, directory });
}

async function migrate({ context }) {
  const directory = context.directories.server;

  if (!fs.existsSync(path.join(directory, 'package.json'))) {
    await prepareServer({ context, directory });
  }

  // The migrate script imports the built config and plugin maps; without a
  // build there is nothing to migrate against.
  if (!fs.existsSync(path.join(directory, 'build'))) {
    context.logger.error(
      'No build found. Run "lowdefy build" before "lowdefy migrate" — migrations run against build artifacts.'
    );
    process.exitCode = 1;
    await context.sendTelemetry();
    return;
  }

  // The stage (design D13) is resolved here, once, and passed to the script
  // explicitly, so the confirmation print and the run can never disagree.
  // startUp already loaded .env into process.env, so STAGE from .env counts.
  const stage = resolveMigrationStage({
    stage: context.options.stage,
    env: process.env,
    buildStage: 'dev',
  });
  const options = { ...context.options, stage };

  const plan = await readMigrationPlan({ context, directory, stage });
  const confirmed = await confirmMigrate({ context, options, plan });
  if (!confirmed) {
    process.exitCode = 1;
    await context.sendTelemetry();
    return;
  }

  try {
    await runLowdefyMigrate({
      context,
      directory,
      scriptArgs: buildScriptArgs({ options }),
    });
  } catch (error) {
    // spawnProcess rejects on a non-zero exit — a failed or refused migration.
    // The script already printed why; the command owns the exit code.
    context.logger.error(error.message);
    process.exitCode = 1;
  }
  await context.sendTelemetry();
}

export default migrate;
