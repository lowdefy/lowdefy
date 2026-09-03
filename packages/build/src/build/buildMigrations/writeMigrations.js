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

import { type, serializer } from '@lowdefy/helpers';

// One artifact per migration, build/migrations/<id>.json ({ id, checksum,
// routine }), mirroring build/api/<endpointId>.json, plus the ordered index
// build/migrations.json ({ stage, migrations: [{ id, checksum, applied }] })
// the runner, the serving preflight and the dev status read. `applied` is
// what the stage's ledger said at build time (design §3.2), so the preflight
// needs no database. The index is written with an empty list when nothing is
// declared, so the runtime never needs an existence check (the "build always
// writes the artifact" principle).
async function writeMigrations({ context }) {
  const migrations = type.isArray(context.migrations) ? context.migrations : [];
  const stage = type.isString(context.migrationsStage) ? context.migrationsStage : null;

  await Promise.all(
    migrations.map((migration) =>
      context.writeBuildArtifact(
        `migrations/${migration.id}.json`,
        serializer.serializeToString({
          id: migration.id,
          checksum: migration.checksum,
          name: migration.name,
          routine: migration.routine,
        })
      )
    )
  );

  const index = {
    stage,
    migrations: migrations.map((migration) => ({
      id: migration.id,
      checksum: migration.checksum,
      applied: migration.applied === true,
      ledgerChecksum: migration.ledgerChecksum,
    })),
  };
  await context.writeBuildArtifact('migrations.json', serializer.serializeToString(index));
}

export default writeMigrations;
