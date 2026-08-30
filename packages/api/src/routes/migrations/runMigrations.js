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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import computeMigrationPlan from './computeMigrationPlan.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import createMongoLedger from './createMongoLedger.js';
import runMigrationRoutine from './runMigrationRoutine.js';

// The migration runner. Runs on a system context (the caller applied
// applySystemTrust before calling this). Reads the ordered index and the
// ledger, computes the pending set (design D3/D5), then — unless dry-run —
// takes the advisory lock and applies each pending migration in order,
// appending a ledger entry as each completes (design D14) so a crash leaves
// only the unapplied ones to re-run (design D10). A failure stops the run,
// releases the lock, and leaves the failed migration's ledger entry absent.
//
// Dependencies (the ledger, the per-migration runner, the index reader) are
// injectable for tests; by default they are built from the context.
function defaultReadIndex(context) {
  return async () => {
    // readConfigFile deserializes .json artifacts, so the index is already an
    // array of { id, checksum }.
    const index = await context.readConfigFile('migrations.json');
    return type.isArray(index) ? index : [];
  };
}

async function runMigrations(context, { options = {}, deps = {} } = {}) {
  const {
    dryRun = false,
    to,
    allowChecksumMismatch = false,
    ledgerConnectionId = 'migrations',
    lockTimeoutMs = 900000,
  } = options;

  context.evaluateOperators = context.evaluateOperators ?? createEvaluateOperators(context);

  const readIndex = deps.readIndex ?? defaultReadIndex(context);
  const ledger =
    deps.ledger ?? createMongoLedger(context, { connectionId: ledgerConnectionId, lockTimeoutMs });
  const runMigration = deps.runMigration ?? ((migration) => runMigrationRoutine(context, migration));

  const index = await readIndex();
  const applied = await ledger.readApplied();
  const { pending, mismatches, missingFiles } = computeMigrationPlan({
    index,
    applied,
    options: { to, allowChecksumMismatch },
  });

  if (mismatches.length > 0) {
    const list = mismatches.map((m) => `"${m.id}"`).join(', ');
    if (!allowChecksumMismatch) {
      throw new ConfigError(
        `Applied migration(s) ${list} have changed since they were applied — the ledger no longer describes what ran. An applied migration is immutable history; correct a mistake with a new forward migration. Re-run with --allow-checksum-mismatch only if the edit is a known no-op (whitespace or comment).`
      );
    }
    context.logger.warn(
      `Checksum mismatch on applied migration(s) ${list} — proceeding because --allow-checksum-mismatch was set.`
    );
  }
  missingFiles.forEach((id) => {
    context.logger.warn(
      `Applied migration "${id}" has no file in this build — it was renamed or deleted. Renaming an applied migration is unsupported (design D3).`
    );
  });

  if (dryRun) {
    return { dryRun: true, pending, mismatches, missingFiles, applied: [] };
  }

  if (pending.length === 0) {
    context.logger.info('No pending migrations — the database is up to date.');
    return { dryRun: false, pending: [], mismatches, missingFiles, applied: [] };
  }

  const holder = `${context.rid ?? 'migrate'}:${process.pid}`;
  await ledger.acquireLock({ holder });
  const heartbeat = setInterval(() => {
    ledger.refreshLock({ holder }).catch((error) => {
      context.logger.warn({ err: error }, 'Failed to refresh the migration lock heartbeat.');
    });
  }, Math.max(1000, Math.floor(lockTimeoutMs / 3)));
  if (typeof heartbeat.unref === 'function') {
    heartbeat.unref();
  }

  const appliedNow = [];
  let failure;
  try {
    for (const migration of pending) {
      const start = Date.now();
      context.logger.info(`Migrating "${migration.id}"…`);
      const { status, error, documents } = await runMigration(migration);
      const durationMs = Date.now() - start;
      if (status === 'error' || status === 'reject') {
        failure = { id: migration.id, error, durationMs };
        break;
      }
      await ledger.insertEntry({
        id: migration.id,
        checksum: migration.checksum,
        appliedAt: new Date(),
        durationMs,
        documents,
        status: 'applied',
        lowdefyVersion: context.appMeta?.version,
      });
      appliedNow.push({ id: migration.id, durationMs, documents });
      context.logger.info(
        `Applied "${migration.id}" (${durationMs}ms, ${documents} document${
          documents === 1 ? '' : 's'
        }).`
      );
    }
  } finally {
    clearInterval(heartbeat);
    await ledger.releaseLock({ holder });
  }

  if (failure) {
    context.logger.error(
      { err: failure.error },
      `Migration "${failure.id}" failed after ${failure.durationMs}ms. Its ledger entry was not written, so it re-runs on the next "lowdefy migrate". ${appliedNow.length} migration(s) applied before it stay applied.`
    );
  }

  return {
    dryRun: false,
    applied: appliedNow,
    failed: failure ? { id: failure.id, message: failure.error?.message } : null,
    pending: pending.map((m) => m.id),
    mismatches,
    missingFiles,
  };
}

export default runMigrations;
