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
// build/migrations.json ([{ id, checksum }]) the runner and the serving
// preflight read. The index is written as [] when nothing is declared, so the
// runtime never needs an existence check (the "build always writes the
// artifact" principle).
async function writeMigrations({ context }) {
  const migrations = type.isArray(context.migrations) ? context.migrations : [];

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

  const index = migrations.map((migration) => ({
    id: migration.id,
    checksum: migration.checksum,
  }));
  await context.writeBuildArtifact('migrations.json', serializer.serializeToString(index));
}

export default writeMigrations;
