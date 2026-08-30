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

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ConfigError, ServiceError } from '@lowdefy/errors';
import { runMigrations } from '@lowdefy/api';

import createSystemContext from '../lib/server/auth/createSystemContext.js';

const argv = yargs(hideBin(process.argv)).argv;

// Runs the app's pending migrations against its own database (design D7). This
// is the server-package half of `lowdefy migrate`: the CLI spawns it here
// because this is where the connection plugins and the database driver are
// installed. It runs on a caller-less system context (applySystemTrust),
// exactly like a scheduled endpoint, so migration steps that touch a walled
// connection must declare tenant: none or runAs (enforced at build).
async function run() {
  // No auth engine needed: migrations carry no user. The context reads the
  // built config, the connection plugin map, and secrets from the environment.
  const context = createSystemContext();

  const options = {
    dryRun: argv.dryRun === true,
    to: typeof argv.to === 'string' && argv.to !== '' ? argv.to : undefined,
    allowChecksumMismatch: argv.allowChecksumMismatch === true,
    ledgerConnectionId: context.config?.migrations?.ledgerConnectionId ?? 'migrations',
    lockTimeoutMs: context.config?.migrations?.lockTimeoutMs,
  };

  context.logger.info(
    `Migrating against ledger connection "${options.ledgerConnectionId}"${
      options.dryRun ? ' (dry run — no writes)' : ''
    }.`
  );

  const report = await runMigrations(context, { options });

  if (argv.json === true) {
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } else if (report.dryRun) {
    if (report.pending.length === 0) {
      context.logger.info('Dry run: no pending migrations.');
    } else {
      context.logger.info(`Dry run: ${report.pending.length} migration(s) would run, in order:`);
      report.pending.forEach((migration) => context.logger.info(`  • ${migration.id}`));
    }
  } else if (report.applied.length === 0 && !report.failed) {
    context.logger.info('No pending migrations — the database is up to date.');
  } else {
    context.logger.info(
      `Applied ${report.applied.length} migration(s)${report.failed ? `, then "${report.failed.id}" failed` : ''}.`
    );
  }

  if (report.failed) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  // A refusal (checksum mismatch, lock held) is a clean, expected stop — print
  // the message, not a stack. Anything else is a bug and shows its stack.
  if (error instanceof ConfigError || error instanceof ServiceError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
});
