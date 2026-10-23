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

// Vite's watcher crawls build/, which holds thousands of page, request, api and map files that no
// module imports. Only what the client and server code import (and what those files pull in
// from their own folders) can change what Vite serves, so everything else under build/ is
// ignored. The set is derived from the imports in the source, so a new import is watched without
// editing a list.

const SOURCE_DIRS = ['client', 'lib/client', 'lib/server', 'lib/docs', 'src'];
const IMPORT_PATTERN = /(?:from|import\s*\(?)\s*['"]([^'"]+)['"]/g;

function listSourceFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return /\.(js|jsx|mjs)$/.test(entry.name) && !entry.name.includes('.test.') ? [full] : [];
  });
}

// Build files imported statically or dynamically by the source, as paths relative to build/.
function getImportedBuildFiles({ root }) {
  const buildDir = path.join(root, 'build');
  const imported = new Set();
  for (const dir of SOURCE_DIRS) {
    for (const file of listSourceFiles(path.join(root, dir))) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(IMPORT_PATTERN)) {
        if (!match[1].startsWith('.')) continue;
        const relative = path.relative(buildDir, path.resolve(path.dirname(file), match[1]));
        if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) {
          imported.add(relative.split(path.sep).join('/'));
        }
      }
    }
  }
  return [...imported].sort();
}

// What stays watched: each imported file, every folder an import lives in (plugins/, i18n/,
// whose files import each other), and the CSS in build/, which globals.css imports in turn
// (tailwind-candidates.css is the recompile trigger for the JIT builder).
function getWatchedBuildEntries({ root }) {
  const files = new Set();
  const folders = new Set();
  for (const file of getImportedBuildFiles({ root })) {
    const [first, ...rest] = file.split('/');
    if (rest.length > 0) folders.add(first);
    else files.add(file);
  }
  return { files: [...files].sort(), folders: [...folders].sort() };
}

function createBuildWatchIgnore({ root }) {
  const buildDir = path.join(root, 'build');
  const { files, folders } = getWatchedBuildEntries({ root });
  const watchedFiles = new Set(files);
  const watchedFolders = new Set(folders);
  return function ignoreBuildFile(filePath) {
    const relative = path.relative(buildDir, filePath);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return false;
    const [first, ...rest] = relative.split(path.sep);
    if (rest.length > 0) return !watchedFolders.has(first);
    return !(watchedFiles.has(first) || first.endsWith('.css') || watchedFolders.has(first));
  };
}

export { createBuildWatchIgnore, getImportedBuildFiles, getWatchedBuildEntries };
