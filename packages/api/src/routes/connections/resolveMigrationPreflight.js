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
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The migration preflight: refuse to serve while the build index lists a
// migration the stage ledger did not record as applied (design D8), the
// mirror of resolveTenantPreflight. Lazily-run-once and awaited per request
// in the api-context middleware, because there is no awaited boot gate and a
// serverless cold start would turn a boot refusal into an opaque crash.
//
// The check is a pure read of build/migrations.json: the build baked the
// stage's ledger in as `applied` per migration (design §3.2), so there is no
// database round trip, no lock, and no in-progress case. A refusal memoizes
// until restart — the build does not fix itself, the next deploy (built after
// the ledger commit) does. Only a failure to read the artifact retries.
const preflightByConfig = new WeakMap();

async function runPreflight(context) {
  const index = await context.readConfigFile('migrations.json');
  if (type.isNone(index) || type.isArray(index) || !type.isArray(index.migrations)) {
    // A build older than the per-stage ledger has no index in this shape —
    // nothing to check. Written on every current build, so this only happens
    // on a stale build.
    context.logger.warn(
      'Migration preflight skipped — build/migrations.json is missing or from an older lowdefy version. Rebuild with a matching lowdefy version to enable the pending-migration check.'
    );
    return;
  }
  if (index.migrations.length === 0) {
    return;
  }
  const pending = index.migrations.filter((migration) => migration.applied !== true);
  if (pending.length > 0) {
    const changed = pending.filter((migration) => !type.isNone(migration.ledgerChecksum));
    const changedNote =
      changed.length === 0
        ? ''
        : ` ${changed.length} of them (${changed
            .map((m) => `"${m.id}"`)
            .join(', ')}) changed after being applied.`;
    throw new ConfigError(
      `Migration preflight refused to serve the app: ${
        pending.length
      } migration(s) are not recorded as applied to stage "${index.stage}" — ${pending
        .map((m) => `"${m.id}"`)
        .join(
          ', '
        )}.${changedNote} Run "lowdefy migrate" for this stage, commit .lowdefy/migrations/${
        index.stage
      }.json, and redeploy. To opt out, set config.migrations.preflight: false.`
    );
  }
  // The migration state of this process, on the one line that knows it: the
  // process_started marker is emitted before any request, and the preflight is
  // resolved lazily on the first one. Grouped with that marker by git_sha.
  context.logger.info(
    {
      event: 'migrations_checked',
      stage: index.stage,
      migrations: index.migrations.map(({ id }) => id),
    },
    `Migration preflight passed — all ${index.migrations.length} migration(s) applied to stage "${index.stage}".`
  );
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
          // A failed artifact read retries on the next request. A refusal
          // stays memoized: the migration must run and the app redeploy.
          preflightByConfig.delete(context.config);
        }
        throw error;
      })
    );
  }
  return preflightByConfig.get(context.config);
}

export default resolveMigrationPreflight;
