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

import { readFile, writeFile } from '@lowdefy/node-utils';

// lowdefy init ignores the CLI's working directory, but the per-stage migration
// ledgers under .lowdefy/migrations/ must be committed, and the local stage's
// ledger (each developer's own database) must not. The ignore must be
// `.lowdefy/*` (direct children only): git cannot re-include a file whose parent
// is matched by `.lowdefy/**`, so under that pattern `!.lowdefy/migrations/`
// un-ignores the directory entry and the ledger files inside it stay ignored.
const BROKEN_IGNORE_LINE = '.lowdefy/**';
const IGNORE_LINE = '.lowdefy/*';
const GITIGNORE_LINES = ['!.lowdefy/migrations/', '.lowdefy/migrations/local.json'];

async function ensureGitignore({ context, configDirectory }) {
  const gitignorePath = path.join(configDirectory, '.gitignore');
  const existing = fs.existsSync(gitignorePath) ? await readFile(gitignorePath) : '';
  const lines = existing.split(/\r?\n/);
  const repaired = lines.map((line) => (line === BROKEN_IGNORE_LINE ? IGNORE_LINE : line));
  const wasRepaired = repaired.some((line, index) => line !== lines[index]);
  const missing = GITIGNORE_LINES.filter((line) => !repaired.includes(line));
  if (missing.length === 0 && !wasRepaired) {
    return false;
  }
  const base = repaired.join('\n');
  const separator = base === '' || base.endsWith('\n') ? '' : '\n';
  const content = missing.length === 0 ? base : `${base}${separator}${missing.join('\n')}\n`;
  await writeFile(gitignorePath, content);
  if (wasRepaired) {
    context.logger.info(
      `Replaced '${BROKEN_IGNORE_LINE}' with '${IGNORE_LINE}' in '.gitignore' so the migration ledgers can be committed.`
    );
  }
  if (missing.length > 0) {
    context.logger.info(
      `Added ${missing.map((line) => `'${line}'`).join(' and ')} to '.gitignore'.`
    );
  }
  return true;
}

export { GITIGNORE_LINES, IGNORE_LINE };
export default ensureGitignore;
