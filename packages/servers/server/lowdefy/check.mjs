#!/usr/bin/env node
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

import fs from 'fs/promises';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { check, checkAgainst } from '@lowdefy/build';
import { createNodeLogger } from '@lowdefy/logger/node';
import createCustomPluginMessagesMap from './createCustomPluginMessagesMap.mjs';
import createCustomPluginTypesMap from './createCustomPluginTypesMap.mjs';

const argv = yargs(hideBin(process.argv)).argv;

// Runs the validation phase only and writes { errors, warnings } to
// build/checkReport.json. Always exits 0 when the check itself ran: the CLI
// reads the report and owns the exit code, so a non-zero exit here always means
// the check broke, never that the config has errors.
async function run() {
  const serverDirectory = path.resolve(
    argv.serverDirectory || process.env.LOWDEFY_DIRECTORY_SERVER || process.cwd()
  );
  const directories = {
    build: path.join(serverDirectory, 'build'),
    config: path.resolve(
      argv.configDirectory || process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd()
    ),
    server: serverDirectory,
  };

  const customTypesMap = await createCustomPluginTypesMap({ directories });
  const customMessagesMap = await createCustomPluginMessagesMap({ directories });

  const logger = createNodeLogger({
    name: 'lowdefy_check',
    level: process.env.LOWDEFY_LOG_LEVEL ?? 'info',
    base: { pid: undefined, hostname: undefined },
  });

  const buildOptions = {
    customMessagesMap,
    customTypesMap,
    directories,
    logger,
    refResolver: argv.refResolver || process.env.LOWDEFY_BUILD_REF_RESOLVER,
  };

  const report = await check(buildOptions);

  // The CLI checks out the target ref and the merge base into worktrees and
  // names them here, so the ids of the three sides are collected in the one
  // process that has the build.
  if (process.env.LOWDEFY_CHECK_AGAINST_REF) {
    report.against = await checkAgainst({
      againstDirectory: process.env.LOWDEFY_CHECK_AGAINST_CONFIG,
      baseDirectory: process.env.LOWDEFY_CHECK_BASE_CONFIG,
      buildOptions,
      ref: process.env.LOWDEFY_CHECK_AGAINST_REF,
    });
  }

  await fs.mkdir(directories.build, { recursive: true });
  await fs.writeFile(path.join(directories.build, 'checkReport.json'), JSON.stringify(report));
}

run();
