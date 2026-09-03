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
import {
  getMigrationLedgerPath,
  readMigrationLedger,
  writeMigrationLedger,
} from '@lowdefy/node-utils';

// The ledger is a committed file per environment,
// <configDirectory>/.lowdefy/migrations/<stage>.json (design §4, D2). The
// runner reads it once at the start of a run and rewrites it in full after
// every applied migration, so a crash leaves exactly the progress made on
// disk (design D9, D14). No database is involved: the same ledger shape
// records a migration over any connection type.
function createFileLedger({ configDirectory, stage }) {
  if (!type.isString(configDirectory) || configDirectory === '') {
    throw new ConfigError(
      'The migrations ledger needs the config directory (LOWDEFY_DIRECTORY_CONFIG) to locate .lowdefy/migrations/<stage>.json.'
    );
  }
  async function read() {
    try {
      const ledger = await readMigrationLedger({ configDirectory, stage });
      return ledger.applied;
    } catch (error) {
      throw new ConfigError(error.message, { cause: error });
    }
  }
  async function write(applied) {
    await writeMigrationLedger({ configDirectory, stage, applied });
  }
  return {
    path: getMigrationLedgerPath({ configDirectory, stage }),
    read,
    write,
  };
}

export default createFileLedger;
