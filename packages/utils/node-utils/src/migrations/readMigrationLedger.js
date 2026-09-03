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

import getMigrationLedgerPath from './getMigrationLedgerPath.js';
import readFile from '../readFile.js';

function invalidLedger({ ledgerPath, reason }) {
  return new Error(
    `Migration ledger "${ledgerPath}" is not valid: ${reason}. The ledger is written by "lowdefy migrate"; restore it from git or fix the file by hand.`
  );
}

// Reads .lowdefy/migrations/<stage>.json. A missing file is an empty ledger —
// a stage that has never been migrated — so a fresh environment needs no
// setup step. A file that exists but is malformed is an error, never silently
// treated as empty: an empty ledger would re-run every migration.
async function readMigrationLedger({ configDirectory, stage }) {
  const ledgerPath = getMigrationLedgerPath({ configDirectory, stage });
  const raw = await readFile(ledgerPath);
  if (type.isNone(raw)) {
    return { stage, applied: [] };
  }
  let ledger;
  try {
    ledger = JSON.parse(raw);
  } catch (error) {
    throw invalidLedger({ ledgerPath, reason: error.message });
  }
  if (!type.isObject(ledger)) {
    throw invalidLedger({ ledgerPath, reason: 'expected an object with an "applied" array' });
  }
  if (!type.isArray(ledger.applied)) {
    throw invalidLedger({ ledgerPath, reason: '"applied" must be an array' });
  }
  ledger.applied.forEach((entry, index) => {
    if (!type.isObject(entry) || !type.isString(entry.id) || !type.isString(entry.checksum)) {
      throw invalidLedger({
        ledgerPath,
        reason: `applied[${index}] must be an object with string "id" and "checksum"`,
      });
    }
  });
  if (!type.isNone(ledger.stage) && ledger.stage !== stage) {
    throw invalidLedger({
      ledgerPath,
      reason: `it records stage "${ledger.stage}" but is being read as stage "${stage}"`,
    });
  }
  return { stage, applied: ledger.applied };
}

export default readMigrationLedger;
