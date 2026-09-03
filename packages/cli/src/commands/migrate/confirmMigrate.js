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

import readline from 'node:readline/promises';

// A migration writes to a real database (design D13). A dry run and a --yes
// run never prompt; every other interactive run asks first, against whichever
// database the environment points at. --json is an output format, not consent
// — it never stands in for --yes. A non-interactive run (CI, a pipe) with
// neither --yes nor --dry-run refuses rather than guessing.
async function confirmMigrate({ context, options, input = process.stdin, output = process.stdout }) {
  if (options.dryRun === true || options.yes === true) {
    return true;
  }
  if (!input.isTTY) {
    throw new Error(
      'lowdefy migrate needs confirmation before writing to a database, but stdin is not interactive. Re-run with --yes to confirm in a non-interactive environment (CI), or --dry-run to preview.'
    );
  }
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(
      'This will run pending migrations against the database configured for this environment. Continue? [y/N] '
    );
    const confirmed = /^y(es)?$/i.test(answer.trim());
    if (!confirmed) {
      context.logger.info('Aborted — no migrations were run.');
    }
    return confirmed;
  } finally {
    rl.close();
  }
}

export default confirmMigrate;
