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

import fs from 'fs';

import readTrustedRepositories from './readTrustedRepositories.js';

async function hubTrusted() {
  const repositories = readTrustedRepositories();
  if (repositories.length === 0) {
    process.stdout.write('No repositories are trusted.\n');
    return;
  }
  const missing = repositories.filter((repository) => !fs.existsSync(repository));
  const lines = repositories.map((repository) =>
    missing.includes(repository) ? `${repository} (missing)` : repository
  );
  process.stdout.write(`${lines.join('\n')}\n`);
  if (missing.length > 0) {
    process.stdout.write(
      'Entries marked (missing) name a directory that is gone. Remove one with `lowdefy hub untrust <path>`.\n'
    );
  }
}

export default hubTrusted;
