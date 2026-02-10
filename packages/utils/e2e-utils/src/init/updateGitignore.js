/*
  Copyright 2020-2024 Lowdefy, Inc

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

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

const E2E_GITIGNORE_ENTRIES = [
  '# E2E Testing',
  '**/test-results/',
  '**/playwright-report/',
  '.mdb-e2e-state.json',
];

function updateGitignore(cwd) {
  const gitignorePath = path.join(cwd, '.gitignore');

  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf8');
  }

  const linesToAdd = [];

  for (const entry of E2E_GITIGNORE_ENTRIES) {
    // Skip comments when checking for existing entries
    if (entry.startsWith('#')) {
      continue;
    }
    if (!content.includes(entry)) {
      linesToAdd.push(entry);
    }
  }

  if (linesToAdd.length === 0) {
    console.log('\n✓ .gitignore already contains e2e entries');
    return false;
  }

  // Add section header if we're adding entries
  const sectionHeader = '\n# E2E Testing\n';
  const newContent = content.trimEnd() + sectionHeader + linesToAdd.join('\n') + '\n';

  fs.writeFileSync(gitignorePath, newContent);
  console.log(`\n✓ Updated .gitignore with e2e entries:`);
  for (const entry of linesToAdd) {
    console.log(`    ${entry}`);
  }

  return true;
}

export default updateGitignore;
