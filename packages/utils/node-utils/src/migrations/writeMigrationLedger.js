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
import getMigrationLedgerPath from './getMigrationLedgerPath.js';
import writeFile from '../writeFile.js';

// Rewrites the stage's ledger in full, entries sorted by id and
// pretty-printed, so every write produces a minimal, reviewable git diff.
async function writeMigrationLedger({ configDirectory, stage, applied }) {
  const ledgerPath = getMigrationLedgerPath({ configDirectory, stage });
  // Plain code-unit order, the same order the build sorts migration ids in.
  const sorted = [...applied].sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
  await writeFile(ledgerPath, `${JSON.stringify({ stage, applied: sorted }, null, 2)}\n`);
  return ledgerPath;
}

export default writeMigrationLedger;
