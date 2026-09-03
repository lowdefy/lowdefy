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
import createFileLedger from './createFileLedger.js';
import describeMigrationTargets from './describeMigrationTargets.js';
import runMigrationRoutine from './runMigrationRoutine.js';

// The migration runner. Runs on a system context (the caller applied
// applySystemTrust before calling this). Reads the ordered index the build
// wrote for a stage and that stage's ledger file, computes the pending set
// (design D3/D5), then — unless dry-run — applies each pending migration in
// order, rewriting the ledger file as each completes (design D14) so a crash
// leaves only the unapplied ones to re-run (design D10). A failure stops the
// run and leaves the failed migration's ledger entry absent. There is no lock:
// the pipeline's concurrency group serialises runs (design D9).
//
// Dependencies (the ledger, the per-migration runner, the index reader) are
// injectable for tests; by default they are built from the context.
function defaultReadIndex(context) {
  return async () => {
    // readConfigFile deserializes .json artifacts, so the index is already
    // { stage, migrations: [{ id, checksum, applied }] }.
    return context.readConfigFile('migrations.json');
  };
}

function assertIndexForStage({ index, stage }) {
  if (type.isNone(index) || type.isArray(index) || !type.isArray(index.migrations)) {
    throw new ConfigError(
      'The build has no migrations index (build/migrations.json) in the current shape. Run "lowdefy build" with this lowdefy version before "lowdefy migrate".'
    );
  }
  if (index.migrations.length > 0 && index.stage !== stage) {
    throw new ConfigError(
      `The build was made for stage "${index.stage}" but "lowdefy migrate" is running for stage "${stage}". A build carries one stage's ledger; rebuild with STAGE=${stage} (or pass --stage ${index.stage}) so the build and the run agree.`
    );
  }
}

function formatTarget(target) {
  if (!type.isNone(target.error)) {
    return `could not resolve: ${target.error}`;
  }
  if (type.isNone(target.database)) {
    return String(target.type);
  }
  return `${target.type} database "${target.database}"`;
}

async function runMigrations(context, { options = {}, deps = {} } = {}) {
  const { stage, dryRun = false, to, allowChecksumMismatch = false, runner = 'unknown' } = options;
  if (!type.isString(stage) || stage === '') {
    throw new ConfigError(
      `runMigrations requires a stage naming the environment. Received ${JSON.stringify(stage)}.`
    );
  }

  context.evaluateOperators = context.evaluateOperators ?? createEvaluateOperators(context);

  const readIndex = deps.readIndex ?? defaultReadIndex(context);
  const ledger =
    deps.ledger ?? createFileLedger({ configDirectory: context.configDirectory, stage });
  const runMigration =
    deps.runMigration ?? ((migration) => runMigrationRoutine(context, migration));
  const describeTargets =
    deps.describeTargets ?? ((pending) => describeMigrationTargets(context, { pending }));

  const index = await readIndex();
  assertIndexForStage({ index, stage });
  let applied = await ledger.read();
  const { pending, mismatches, missingFiles } = computeMigrationPlan({
    index: index.migrations,
    applied,
    options: { to, allowChecksumMismatch },
  });

  if (mismatches.length > 0) {
    const list = mismatches.map((m) => `"${m.id}"`).join(', ');
    if (!allowChecksumMismatch) {
      throw new ConfigError(
        `Applied migration(s) ${list} have changed since they were applied to stage "${stage}" — the ledger no longer describes what ran. An applied migration is immutable history; correct a mistake with a new forward migration. Re-run with --allow-checksum-mismatch only if the edit is a known no-op (whitespace or comment).`
      );
    }
    context.logger.warn(
      `Checksum mismatch on applied migration(s) ${list} — proceeding because --allow-checksum-mismatch was set.`
    );
    if (!dryRun) {
      // Record the current checksum (design D3) so the tolerated edit does not
      // warn again on every subsequent run or build.
      const builtChecksumById = new Map(mismatches.map((m) => [m.id, m.builtChecksum]));
      applied = applied.map((entry) =>
        builtChecksumById.has(entry.id)
          ? { ...entry, checksum: builtChecksumById.get(entry.id) }
          : entry
      );
      await ledger.write(applied);
    }
  }
  missingFiles.forEach((id) => {
    context.logger.warn(
      `Applied migration "${id}" has no file in this build — it was renamed or deleted. Renaming an applied migration is unsupported (design D3).`
    );
  });

  const targets = pending.length > 0 ? await describeTargets(pending) : [];
  const report = {
    stage,
    ledgerPath: ledger.path,
    targets,
    pending: pending.map((m) => m.id),
    mismatches,
    missingFiles,
  };

  if (dryRun) {
    return { ...report, dryRun: true, applied: [], failed: null };
  }

  if (pending.length === 0) {
    context.logger.info(`No pending migrations for stage "${stage}" — the database is up to date.`);
    return { ...report, dryRun: false, applied: [], failed: null };
  }

  context.logger.info(
    `Applying ${pending.length} migration(s) to stage "${stage}" — ledger ${ledger.path}.`
  );
  targets.forEach((target) => {
    context.logger.info(`  connection "${target.connectionId}" → ${formatTarget(target)}`);
  });

  const appliedNow = [];
  let failure = null;
  for (const migration of pending) {
    const start = Date.now();
    context.logger.info(`Migrating "${migration.id}"…`);
    const { status, error, documents } = await runMigration(migration);
    const durationMs = Date.now() - start;
    if (status === 'error' || status === 'reject') {
      failure = { id: migration.id, error, durationMs };
      break;
    }
    applied = [
      ...applied,
      {
        id: migration.id,
        checksum: migration.checksum,
        appliedAt: new Date().toISOString(),
        durationMs,
        documents,
        lowdefyVersion: context.appMeta?.version,
        runner,
      },
    ];
    await ledger.write(applied);
    appliedNow.push({ id: migration.id, durationMs, documents });
    context.logger.info(
      `Applied "${migration.id}" (${durationMs}ms, ${documents} document${
        documents === 1 ? '' : 's'
      }).`
    );
  }

  if (failure) {
    context.logger.error(
      { err: failure.error },
      `Migration "${failure.id}" failed after ${failure.durationMs}ms. Its ledger entry was not written, so it re-runs on the next "lowdefy migrate". ${appliedNow.length} migration(s) applied before it are recorded in ${ledger.path}.`
    );
  }

  return {
    ...report,
    dryRun: false,
    applied: appliedNow,
    failed: failure ? { id: failure.id, message: failure.error?.message } : null,
  };
}

export default runMigrations;
