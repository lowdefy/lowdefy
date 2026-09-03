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

import os from 'node:os';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ConfigError } from '@lowdefy/errors';
import { runMigrations } from '@lowdefy/api';
import { resolveMigrationStage } from '@lowdefy/node-utils';

import createSystemContext from '../lib/server/auth/createSystemContext.js';

const argv = yargs(hideBin(process.argv)).argv;

// Who applied a migration, recorded per ledger entry (design §4): the CI run
// when there is one, otherwise the user and host at the terminal.
function describeRunner() {
  if (process.env.GITHUB_RUN_ID) {
    return `github-actions:run-${process.env.GITHUB_RUN_ID}`;
  }
  let username = 'unknown';
  try {
    username = os.userInfo().username;
  } catch {
    // userInfo throws on some minimal containers; the hostname still identifies the run.
  }
  return `${username}@${os.hostname()}`;
}

function formatTarget(target) {
  if (target.error) {
    return `could not resolve: ${target.error}`;
  }
  if (!target.database) {
    return String(target.type);
  }
  return `${target.type} database "${target.database}"`;
}

// Runs the app's pending migrations against its own database (design D7). This
// is the server-package half of `lowdefy migrate`: the CLI spawns it here
// because this is where the connection plugins and the database driver are
// installed. It runs on a caller-less system context (applySystemTrust),
// exactly like a scheduled endpoint, so migration steps that touch a walled
// connection must declare tenant: none or runAs (enforced at build). The
// stage (design D13) selects the ledger file the run reads and rewrites:
// --stage, then STAGE from the environment, then local.
async function run() {
  // No auth engine needed: migrations carry no user. The context reads the
  // built config, the connection plugin map, and secrets from the environment.
  const context = createSystemContext();

  const stage = resolveMigrationStage({
    stage: typeof argv.stage === 'string' ? argv.stage : undefined,
    env: process.env,
    buildStage: 'dev',
  });
  const options = {
    stage,
    dryRun: argv.dryRun === true,
    to: typeof argv.to === 'string' && argv.to !== '' ? argv.to : undefined,
    allowChecksumMismatch: argv.allowChecksumMismatch === true,
    runner: describeRunner(),
  };

  context.logger.info(
    `Migrating stage "${stage}"${options.dryRun ? ' (dry run — no writes)' : ''}.`
  );

  const report = await runMigrations(context, { options });

  if (argv.json === true) {
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } else if (report.dryRun) {
    if (report.pending.length === 0) {
      context.logger.info(`Dry run: no pending migrations for stage "${stage}".`);
    } else {
      context.logger.info(
        `Dry run: ${report.pending.length} migration(s) would run against stage "${stage}", in order:`
      );
      report.pending.forEach((id) => context.logger.info(`  • ${id}`));
      report.targets.forEach((target) =>
        context.logger.info(`  connection "${target.connectionId}" → ${formatTarget(target)}`)
      );
    }
  } else if (report.applied.length === 0 && !report.failed) {
    context.logger.info(`No pending migrations for stage "${stage}" — the database is up to date.`);
  } else {
    context.logger.info(
      `Applied ${report.applied.length} migration(s)${
        report.failed ? `, then "${report.failed.id}" failed` : ''
      }.`
    );
  }

  if (report.failed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  // A refusal (checksum mismatch, a build made for another stage, a bad
  // --to) is a clean, expected stop — print the message, not a stack.
  // Anything else is a bug and shows its stack.
  if (error instanceof ConfigError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
});
