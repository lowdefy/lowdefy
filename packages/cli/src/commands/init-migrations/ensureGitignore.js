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

// lowdefy init ignores .lowdefy/** — the CLI's working directory — but the
// per-stage migration ledgers under .lowdefy/migrations/ must be committed,
// and the local stage's ledger (each developer's own database) must not.
const GITIGNORE_LINES = ['!.lowdefy/migrations/', '.lowdefy/migrations/local.json'];

async function ensureGitignore({ context, configDirectory }) {
  const gitignorePath = path.join(configDirectory, '.gitignore');
  const existing = fs.existsSync(gitignorePath) ? await readFile(gitignorePath) : '';
  const lines = existing.split(/\r?\n/);
  const missing = GITIGNORE_LINES.filter((line) => !lines.includes(line));
  if (missing.length === 0) {
    return false;
  }
  const separator = existing === '' || existing.endsWith('\n') ? '' : '\n';
  await writeFile(gitignorePath, `${existing}${separator}${missing.join('\n')}\n`);
  context.logger.info(`Added ${missing.map((line) => `'${line}'`).join(' and ')} to '.gitignore'.`);
  return true;
}

export { GITIGNORE_LINES };
export default ensureGitignore;
