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

import { ConfigError, ServiceError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import computeMigrationPlan from '../migrations/computeMigrationPlan.js';
import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import createMongoLedger from '../migrations/createMongoLedger.js';

// The migration preflight: refuse to serve while any built migration is
// unapplied (design D8), the mirror of resolveTenantPreflight. Lazily-run-once
// and awaited per request in the api-context middleware, because there is no
// awaited boot gate and a serverless cold start would turn a boot refusal into
// an opaque crash.
//
// Memoization is split exactly like the tenant preflight's: a refusal (pending
// migrations, a ConfigError) memoizes until restart — the deploy runs the
// migration, the server does not fix itself — while a probe failure
// (connectivity, or a migration in progress) does NOT memoize and retries on
// the next request. The in-progress case is why a cold-started instance never
// serves a half-migrated database: it reads the lock, sees a run in flight,
// and throws a retryable ServiceError until the run finishes.
const preflightByConfig = new WeakMap();

async function runPreflight(context) {
  const migrationsConfig = context.config?.migrations ?? {};
  const connectionId = migrationsConfig.ledgerConnectionId ?? 'migrations';
  const lockTimeoutMs = migrationsConfig.lockTimeoutMs ?? 900000;

  // readConfigFile deserializes .json artifacts, so the index is already an
  // array of { id, checksum }.
  const index = await context.readConfigFile('migrations.json');
  if (type.isNone(index)) {
    // A build older than migrations has no index — nothing to check. Written
    // as [] on every current build, so this only happens on a stale build.
    context.logger.warn(
      'Migration preflight skipped — no migrations.json build artifact. Rebuild with a matching lowdefy version to enable the pending-migration check.'
    );
    return;
  }
  if (!type.isArray(index) || index.length === 0) {
    return;
  }

  // Caller-less: the verdict is memoized per process, so ledger reads must
  // never resolve against whichever caller hit the cold process first.
  const probeContext = { ...context, user: null };
  probeContext.evaluateOperators = createEvaluateOperators(probeContext);
  const ledger = createMongoLedger(probeContext, { connectionId, lockTimeoutMs });

  const lock = await ledger.readLock();
  if (ledger.isHeld(lock)) {
    // Not a ConfigError, so it does not memoize: the run will finish and the
    // next request serves.
    throw new ServiceError(
      `A migration is in progress (lock held by "${lock.holder}"). Retrying until it completes.`,
      { service: connectionId }
    );
  }

  const applied = await ledger.readApplied();
  const { pending } = computeMigrationPlan({ index, applied });
  if (pending.length > 0) {
    throw new ConfigError(
      `Migration preflight refused to serve the app: ${pending.length} migration(s) are pending — ${pending
        .map((m) => `"${m.id}"`)
        .join(
          ', '
        )}. Run "lowdefy migrate" against this database, then restart the server. To opt out, set config.migrations.preflight: false.`
    );
  }
  context.logger.info(`Migration preflight passed — all ${index.length} migration(s) applied.`);
}

function resolveMigrationPreflight(context) {
  if (context.config?.migrations?.preflight === false) {
    return Promise.resolve();
  }
  if (!preflightByConfig.has(context.config)) {
    preflightByConfig.set(
      context.config,
      runPreflight(context).catch((error) => {
        if (!(error instanceof ConfigError)) {
          // Connectivity-class or in-progress failure — retry on the next
          // request. A refusal stays memoized: the migration must run.
          preflightByConfig.delete(context.config);
        }
        throw error;
      })
    );
  }
  return preflightByConfig.get(context.config);
}

export default resolveMigrationPreflight;
