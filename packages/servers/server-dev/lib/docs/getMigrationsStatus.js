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
import { getMigrationLedgerPath, readMigrationLedger } from '@lowdefy/node-utils';

import readBuildArtifact from './readBuildArtifact.js';

function getConfigDirectory() {
  return process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
}

// The build index carries the stage the dev build was made for and, per
// migration, whether that stage's ledger recorded it (design §3.2). Read
// fresh on every call, like every docs route.
function readIndex() {
  const index = readBuildArtifact({ name: 'migrations.json' });
  if (index === null || Array.isArray(index) || !Array.isArray(index.migrations)) {
    return null;
  }
  return index;
}

// The build-status summary: enough for an agent to know a migration is
// pending or changed without a second call (design D14). Synchronous because
// getBuildStatus is.
function summarizeMigrations() {
  const index = readIndex();
  if (index === null) {
    return { stage: null, pending: [], changed: [] };
  }
  return {
    stage: index.stage,
    pending: index.migrations.filter((m) => m.applied !== true).map((m) => m.id),
    changed: index.migrations
      .filter((m) => m.applied !== true && m.ledgerChecksum !== undefined)
      .map((m) => m.id),
  };
}

// The full picture for lowdefy_migrations_status: every built migration with
// its applied flag, the stage, the ledger file and the ledger's entries.
async function getMigrationsStatus() {
  const index = readIndex();
  if (index === null) {
    return {
      stage: null,
      ledgerPath: null,
      migrations: [],
      pending: [],
      changed: [],
      ledger: [],
      note: 'No migrations index in the dev build yet — the build has not completed, or the app has no migrations/ directory.',
    };
  }
  const configDirectory = getConfigDirectory();
  const summary = summarizeMigrations();
  const ledgerPath =
    index.stage === null ? null : getMigrationLedgerPath({ configDirectory, stage: index.stage });
  let ledger = [];
  let ledgerError;
  if (index.stage !== null) {
    try {
      ({ applied: ledger } = await readMigrationLedger({ configDirectory, stage: index.stage }));
    } catch (error) {
      ledgerError = error.message;
    }
  }
  return {
    stage: index.stage,
    ledgerPath,
    migrations: index.migrations,
    pending: summary.pending,
    changed: summary.changed,
    ledger,
    ...(ledgerError === undefined ? {} : { ledgerError }),
  };
}

export { summarizeMigrations };
export default getMigrationsStatus;
