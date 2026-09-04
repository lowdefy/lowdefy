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

// The one discovery rule for every convention-directory Lowdefy reads -
// migrations/, tests/journeys/, tests/requests/ and fixtures/. Four directories
// that each grew their own walk disagreed on recursion, on sort order and on
// what counts as a file; an app author should not have to learn four.
//
// The rule:
//   - <directory>/**/*<suffix>, recursive, so a large app can group its files
//     in subdirectories.
//   - `name` is the path below <directory> with the suffix removed and "/"
//     separators on every platform. Nesting therefore shows in the name, which
//     keeps names unique and keeps a migration id stable as its ledger key.
//   - Byte sort on `name` (code-unit, never localeCompare): the order must be
//     the same on every machine and in every locale, because migrations apply
//     in it.
//   - Names beginning with "_" or "." are skipped, files and directories
//     alike. That is what keeps drafts out of a run - tests/journeys/_candidates
//     holds what `lowdefy journeys compile` proposed, and promoting a candidate
//     is moving the file up out of that directory.
//
// Synchronous: discovery happens once at startup and is shared by a
// synchronous CLI and an asynchronous build, and one implementation both can
// call is worth more than the non-blocking readdir.
function listConfigFiles({ directory, suffixes = ['.yaml', '.yml'] }) {
  const files = [];

  function walk(currentDirectory, prefix) {
    let entries;
    try {
      entries = fs.readdirSync(currentDirectory, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return;
      throw error;
    }
    entries.forEach((entry) => {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) return;
      if (entry.isDirectory()) {
        walk(path.join(currentDirectory, entry.name), `${prefix}${entry.name}/`);
        return;
      }
      if (!entry.isFile()) return;
      const suffix = suffixes.find((candidate) => entry.name.endsWith(candidate));
      if (suffix === undefined) return;
      files.push({
        name: `${prefix}${entry.name.slice(0, -suffix.length)}`,
        fileName: `${prefix}${entry.name}`,
        filePath: path.join(currentDirectory, entry.name),
      });
    });
  }

  walk(directory, '');
  files.sort((a, b) => {
    if (a.name === b.name) return a.fileName < b.fileName ? -1 : 1;
    return a.name < b.name ? -1 : 1;
  });
  return files;
}

export default listConfigFiles;
