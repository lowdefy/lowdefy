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

import { readFile } from '@lowdefy/node-utils';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import ensurePnpmWorkspaceYaml from '../../utils/ensurePnpmWorkspaceYaml.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runLowdefyCheck from '../../utils/runLowdefyCheck.js';
import formatCheckReport from './formatCheckReport.js';

// The app's own plugins tell the check which types exist, so the server
// directory the build maintains is prepared the same way build does — once, on
// a fresh clone; every later check reuses it.
async function prepareServer({ context, directory }) {
  await getServer({ context, packageName: '@lowdefy/server', directory });
  await resetServerPackageJson({ context, directory });
  await addCustomPluginsAsDeps({ context, directory });
  await ensurePnpmWorkspaceYaml({ context, directory });
  await installServer({ context, directory });
}

async function readCheckReport({ directory }) {
  const reportPath = path.join(directory, 'build', 'checkReport.json');
  const content = await readFile(reportPath);
  if (content === null) {
    throw new Error(`Lowdefy check did not write a report to ${reportPath}.`);
  }
  return JSON.parse(content);
}

async function check({ context }) {
  const directory = context.directories.server;
  if (!fs.existsSync(path.join(directory, 'package.json'))) {
    await prepareServer({ context, directory });
  }
  await runLowdefyCheck({ context, directory });
  const report = await readCheckReport({ directory });

  if (context.options.json === true) {
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } else {
    process.stdout.write(
      `${formatCheckReport({ ...report, configDirectory: context.directories.config })}\n`
    );
  }

  // Warnings never fail a check. The exit code is set rather than exiting so
  // pending telemetry and log flushes still complete.
  if (report.errors.length > 0) {
    process.exitCode = 1;
  }
  await context.sendTelemetry({ sendTypes: false });
  return report;
}

export default check;
