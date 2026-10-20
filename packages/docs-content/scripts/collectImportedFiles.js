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
import path from 'path';

// Static imports and re-exports (`... from './x.js'`), side-effect imports
// (`import './x.js'`) and dynamic imports with a literal specifier.
const specifierPatterns = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function isJsFile(file) {
  return ['.js', '.mjs'].includes(path.extname(file));
}

function readRelativeSpecifiers(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const specifiers = new Set();
  specifierPatterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      if (match[1].startsWith('./') || match[1].startsWith('../')) {
        specifiers.add(match[1]);
      }
    }
  });
  return [...specifiers];
}

// A page can reference a JS file, such as a block's meta.js, that builds its
// content from the files it imports: AgGrid's meta.js calls createDisplayMeta.js,
// where the property schema lives. Returns those imported files, followed
// through JS files and relative to configDirectory like the refMap paths, so an
// edit to any of them changes the page's source hash. Only relative imports are
// followed: a package import is versioned with its package.
function collectImportedFiles({ configDirectory, files }) {
  const imported = new Set();
  const queue = files.filter(isJsFile).map((file) => path.resolve(configDirectory, file));
  const visited = new Set(queue);
  while (queue.length > 0) {
    const filePath = queue.pop();
    if (!fs.existsSync(filePath)) {
      continue;
    }
    readRelativeSpecifiers(filePath).forEach((specifier) => {
      const importedPath = path.resolve(path.dirname(filePath), specifier);
      if (visited.has(importedPath) || !fs.existsSync(importedPath)) {
        return;
      }
      visited.add(importedPath);
      // Read for its version, as recordSourceHashes leaves it out.
      if (path.basename(importedPath) === 'package.json') {
        return;
      }
      imported.add(path.relative(configDirectory, importedPath));
      if (isJsFile(importedPath)) {
        queue.push(importedPath);
      }
    });
  }
  return [...imported];
}

export default collectImportedFiles;
