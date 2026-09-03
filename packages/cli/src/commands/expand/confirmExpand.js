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

// Expanding writes over a file in the config directory, which is the author's
// source. Writing a new file needs no permission; replacing one they wrote does,
// unless --yes says otherwise. A non-interactive run without --yes refuses
// rather than overwriting on a guess.
async function confirmExpand({
  context,
  options,
  filePath,
  input = process.stdin,
  output = process.stdout,
}) {
  if (options.yes === true) return true;
  if (!input.isTTY) {
    throw new Error(
      `lowdefy expand would overwrite ${filePath}, but stdin is not interactive. Re-run with --yes to confirm in a non-interactive environment.`
    );
  }
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`Overwrite ${filePath} with the expanded page? [y/N] `);
    const confirmed = /^y(es)?$/i.test(answer.trim());
    if (!confirmed) {
      context.logger.info('Aborted — nothing was written.');
    }
    return confirmed;
  } finally {
    rl.close();
  }
}

export default confirmExpand;
