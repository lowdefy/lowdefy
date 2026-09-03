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
import fs from 'node:fs';
import path from 'node:path';
import { type } from '@lowdefy/helpers';
import { getMigrationLedgerPath, readMigrationLedger } from '@lowdefy/node-utils';

// What the confirmation prompt shows before anything runs (design D13): the
// stage, the ledger file the run will rewrite, and the migrations the build
// index lists that the ledger does not record with a matching checksum. Both
// are plain files the CLI can read without the server's plugins, so the
// operator sees the target before the migrate script is even spawned.
async function readMigrationPlan({ context, directory, stage }) {
  const ledgerPath = getMigrationLedgerPath({ configDirectory: context.directories.config, stage });
  const indexPath = path.join(directory, 'build', 'migrations.json');
  let index = null;
  if (fs.existsSync(indexPath)) {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  }
  const migrations = type.isObject(index) && type.isArray(index.migrations) ? index.migrations : [];
  const ledger = await readMigrationLedger({ configDirectory: context.directories.config, stage });
  const checksumById = new Map(ledger.applied.map((entry) => [entry.id, entry.checksum]));
  const pending = migrations
    .filter((migration) => checksumById.get(migration.id) !== migration.checksum)
    .map((migration) => migration.id);
  return { stage, ledgerPath, pending, buildStage: index?.stage ?? null };
}

export default readMigrationPlan;
