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
import { type } from '@lowdefy/helpers';

import addCustomPluginsAsDeps from '../../utils/addCustomPluginsAsDeps.js';
import ensurePnpmWorkspaceYaml from '../../utils/ensurePnpmWorkspaceYaml.js';
import getServer from '../../utils/getServer.js';
import installServer from '../../utils/installServer.js';
import resetServerPackageJson from '../../utils/resetServerPackageJson.js';
import runLowdefyCheck from '../../utils/runLowdefyCheck.js';
import createAgainstWorktrees from './createAgainstWorktrees.js';
import formatCheckReport from './formatCheckReport.js';

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// The check validates against the types the server directory has installed, so
// a directory installed for an older Lowdefy version or a different plugin set
// reports types the app does have as missing. package.json records exactly what
// was installed - the pristine package.original.json plus the app's plugins -
// so comparing it against what the app asks for now answers "is this directory
// still the right one" without an extra artefact.
function isServerPrepared({ context, directory }) {
  const packageJson = readJson(path.join(directory, 'package.json'));
  const original = readJson(path.join(directory, 'package.original.json'));
  if (packageJson === null || original === null) {
    return false;
  }
  if (context.lowdefyVersion !== 'local' && packageJson.version !== context.lowdefyVersion) {
    return false;
  }
  const expected = { ...(original.dependencies ?? {}) };
  Object.values(context.plugins ?? {}).forEach((plugin) => {
    expected[plugin.name] = plugin.version;
  });
  const installed = packageJson.dependencies ?? {};
  const names = new Set([...Object.keys(expected), ...Object.keys(installed)]);
  return [...names].every((name) => expected[name] === installed[name]);
}

// The app's own plugins tell the check which types exist, so the server
// directory the build maintains is prepared the same way build does — on a
// fresh clone, and again whenever the Lowdefy version or the plugin set the
// app declares no longer matches what is installed there.
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

async function runCheck({ context, directory }) {
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
  if (report.errors.length > 0 || (report.against?.errors ?? []).length > 0) {
    process.exitCode = 1;
  }
  await context.sendTelemetry({ sendTypes: false });
  return report;
}

// The worktrees are read by the build in the check child process, which
// already receives the config directory through the environment
// runLowdefyCheck forwards; the two extra directories travel the same way.
async function checkAgainstRef({ context, directory, ref }) {
  const worktrees = await createAgainstWorktrees({
    configDirectory: context.directories.config,
    ref,
  });
  process.env.LOWDEFY_CHECK_AGAINST_REF = ref;
  process.env.LOWDEFY_CHECK_AGAINST_CONFIG = worktrees.againstDirectory;
  process.env.LOWDEFY_CHECK_BASE_CONFIG = worktrees.baseDirectory;
  try {
    return await runCheck({ context, directory });
  } finally {
    delete process.env.LOWDEFY_CHECK_AGAINST_REF;
    delete process.env.LOWDEFY_CHECK_AGAINST_CONFIG;
    delete process.env.LOWDEFY_CHECK_BASE_CONFIG;
    await worktrees.remove();
  }
}

async function check({ context }) {
  const directory = context.directories.server;
  if (!isServerPrepared({ context, directory })) {
    await prepareServer({ context, directory });
  }
  if (type.isNone(context.options.against)) {
    return runCheck({ context, directory });
  }
  return checkAgainstRef({ context, directory, ref: context.options.against });
}

export default check;
