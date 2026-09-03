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
import { ConfigError, shouldSuppressBuildCheck } from '@lowdefy/errors';

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
async function buildMigrations({ components, context }) {
  // Stored on context, never on components: components is walked by the final
  // addKeys pass, and an empty migrations array there would take a ~k and shift
  // every later key. buildCollections keeps context.collections for the same
  // reason. writeMigrations reads context.migrations.
  context.migrations = [];
  let migrations;
  try {
    migrations = await collectMigrationFiles({ directories: context.directories });
  } catch (error) {
    if (context?.errors) {
      context.errors.push(error);
      return components;
    }
    throw error;
  }
  if (migrations.length === 0) {
    return components;
  }

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
      if (type.isNone(migration.routine)) {
        throw new ConfigError(
          `Migration "${migration.id}" has no "routine". A migration file must declare a "routine" of steps.`,
          { checkSlug: 'migrations' }
        );
      }
      if (!type.isArray(migration.routine)) {
        throw new ConfigError(
          `Migration "${migration.id}" "routine" must be an array of steps. Received ${JSON.stringify(
            migration.routine
          )}.`,
          { received: migration.routine, checkSlug: 'migrations' }
        );
      }
      if (migration.routine.length === 0) {
        throw new ConfigError(
          `Migration "${migration.id}" "routine" is empty. A migration must declare at least one step.`,
          { checkSlug: 'migrations' }
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
      context.migrations.push({
        id: migration.id,
        checksum: migration.checksum,
        name: type.isString(migration.name) ? migration.name : undefined,
        routine: migration.routine,
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
