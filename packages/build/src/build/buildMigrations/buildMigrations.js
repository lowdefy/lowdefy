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
import { ConfigError, ConfigWarning, shouldSuppressBuildCheck } from '@lowdefy/errors';
import { readMigrationLedger, resolveMigrationStage } from '@lowdefy/node-utils';

import addKeys from '../addKeys.js';
import buildRoutine from '../buildApi/buildRoutine/buildRoutine.js';
import collectMigrationFiles from './collectMigrationFiles.js';
import validateId from '../../utils/validateId.js';

// Migrations are files the build discovers under migrations/*.yaml (design D1).
// Each file holds a routine in the same grammar as an Api endpoint routine, so
// MongoDB* request steps, :for, :try and _step all validate through the same
// buildRoutine code an endpoint uses — including the tenant audit, which
// refuses a step that reads a walled connection with neither tenant: none nor
// runAs (design D6). The id is the filename stem; ordering is lexical on the
// id. The normalised result is written per migration to build/migrations/<id>.json
// and to the ordered index build/migrations.json.
//
// The build also resolves the STAGE it is built for and reads that stage's
// ledger, .lowdefy/migrations/<stage>.json (design §3.2, §4), so the index
// carries `applied` per migration and the serving preflight is a file check
// with no database round trip.
function resolveStage({ context, migrationCount }) {
  let stage;
  try {
    stage = resolveMigrationStage({ env: process.env, buildStage: context.stage });
  } catch (error) {
    throw new ConfigError(error.message, { checkSlug: 'migration-files' });
  }
  // `lowdefy check` validates offline and is not made for an environment.
  if (stage === null && migrationCount > 0 && !context.validateOnly) {
    throw new ConfigError(
      `The app has ${migrationCount} migration(s) but no STAGE names the environment this build is for. Set STAGE (e.g. STAGE=prod lowdefy build) so the build carries that environment's migration ledger from .lowdefy/migrations/<stage>.json.`,
      { checkSlug: 'migration-files' }
    );
  }
  return stage;
}

async function readLedger({ context, stage }) {
  if (stage === null) {
    return { stage: null, applied: [] };
  }
  try {
    return await readMigrationLedger({ configDirectory: context.directories.config, stage });
  } catch (error) {
    throw new ConfigError(error.message, { checkSlug: 'migration-files' });
  }
}

function collectError({ context, error }) {
  if (context?.errors) {
    context.errors.push(error);
    return;
  }
  throw error;
}

async function buildMigrations({ components, context }) {
  // Stored on context, never on components: components is walked by the final
  // addKeys pass, and an empty migrations array there would take a ~k and shift
  // every later key. buildCollections keeps context.collections for the same
  // reason. writeMigrations reads context.migrations and context.migrationsStage.
  context.migrations = [];
  context.migrationsStage = null;
  // Raw file texts, for the check-only rule that looks for a required
  // collection field no migration names (design D11).
  context.migrationSources = [];
  let migrations;
  try {
    migrations = await collectMigrationFiles({ directories: context.directories });
  } catch (error) {
    collectError({ context, error });
    return components;
  }
  context.migrationSources = migrations.map((migration) => ({
    id: migration.id,
    text: migration.text,
  }));

  let ledger;
  try {
    const stage = resolveStage({ context, migrationCount: migrations.length });
    ledger = await readLedger({ context, stage });
    context.migrationsStage = stage;
  } catch (error) {
    collectError({ context, error });
    return components;
  }
  if (migrations.length === 0) {
    return components;
  }
  const ledgerById = new Map(ledger.applied.map((entry) => [entry.id, entry]));

  // Key every routine so buildRoutine's step checks can locate errors. addKeys
  // skips objects that already carry a ~k, so keying the collection is safe.
  addKeys({ components: { migrations }, context });

  migrations.forEach((migration) => {
    try {
      validateId({
        id: migration.id,
        field: 'Migration id',
        location: `migration file "${migration.id}"`,
      });
      if (!type.isArray(migration.routine)) {
        throw new ConfigError(
          `Migration "${
            migration.id
          }" "routine" must be an array of steps. Received ${JSON.stringify(migration.routine)}.`,
          { received: migration.routine, checkSlug: 'migration-routine' }
        );
      }
      if (migration.routine.length === 0) {
        throw new ConfigError(
          `Migration "${migration.id}" "routine" is empty. A migration must declare at least one step.`,
          { checkSlug: 'migration-routine' }
        );
      }
      buildRoutine(migration.routine, {
        endpointId: `migration:${migration.id}`,
        typeCounters: context.typeCounters,
        stepTypes: context.typesMap?.steps ?? {},
        tenantConnections: context.tenantConnections,
        tenantCollectionMap: context.tenantCollectionMap,
        collections: context.collections,
      });
      const ledgerEntry = ledgerById.get(migration.id);
      const applied = !type.isNone(ledgerEntry) && ledgerEntry.checksum === migration.checksum;
      if (!type.isNone(ledgerEntry) && !applied) {
        // The file changed after it was applied. The runner refuses this
        // unless --allow-checksum-mismatch rewrites the ledger checksum
        // (design D3); the build names it early, as a warning, because the
        // fix (a migrate run) needs a build to run against.
        context.handleWarning(
          new ConfigWarning(
            `Migration "${migration.id}" has changed since it was applied to stage "${ledger.stage}" (ledger checksum ${ledgerEntry.checksum}, file checksum ${migration.checksum}). An applied migration is immutable history; correct a mistake with a new forward migration, or run "lowdefy migrate --allow-checksum-mismatch" for a known no-op edit.`,
            { checkSlug: 'migration-files' }
          )
        );
      }
      context.migrations.push({
        id: migration.id,
        checksum: migration.checksum,
        name: type.isString(migration.name) ? migration.name : undefined,
        routine: migration.routine,
        applied,
        ledgerChecksum: type.isNone(ledgerEntry) ? undefined : ledgerEntry.checksum,
      });
    } catch (error) {
      if (error instanceof ConfigError && shouldSuppressBuildCheck(error, context.keyMap)) {
        return;
      }
      if (context?.errors) {
        context.errors.push(error);
      } else {
        throw error;
      }
    }
  });

  return components;
}

export default buildMigrations;
