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
import * as espree from 'espree';

function isRelative(specifier) {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

// The relative imports of one module, resolved to absolute paths. A sibling
// that does not exist is left for Node/Vite to report against the importing
// file; bare package imports resolve from the server's node_modules and are
// not followed.
function relativeImports(absolutePath) {
  const source = fs.readFileSync(absolutePath, 'utf8');
  let ast;
  try {
    ast = espree.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    });
  } catch {
    // A file that does not parse fails at import time naming the file; the
    // copy must not swallow it here by refusing to copy the rest.
    return [];
  }
  const found = [];
  for (const node of ast.body) {
    const isImport =
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportAllDeclaration';
    if (!isImport || !node.source) continue;
    if (!isRelative(node.source.value)) continue;
    found.push(path.resolve(path.dirname(absolutePath), node.source.value));
  }
  return found;
}

/**
 * The roots plus the closure of their relative imports, as a sorted list of
 * absolute paths inside the config directory.
 *
 * A module copied into the prod server directory must find the helpers it
 * imports relatively beside the copy.
 */
function collectRelativeImportClosure({ configDirectory, roots }) {
  const files = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const absolutePath = queue.shift();
    if (files.has(absolutePath)) continue;
    if (!fs.existsSync(absolutePath)) continue;
    if (path.relative(configDirectory, absolutePath).startsWith('..')) continue;
    files.add(absolutePath);
    queue.push(...relativeImports(absolutePath));
  }
  return [...files].sort();
}

export default collectRelativeImportClosure;
