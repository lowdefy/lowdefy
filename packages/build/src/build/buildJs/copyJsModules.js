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
import * as espree from 'espree';
import { LowdefyInternalError } from '@lowdefy/errors';
import { copyFileOrDirectory } from '@lowdefy/node-utils';

function isRelative(specifier) {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

// The relative imports of one module, resolved to absolute paths. A sibling
// that does not exist is left for Node/Vite to report against the importing
// file; bare package imports resolve from the server's node_modules and are not
// followed.
function relativeImports(absolutePath) {
  const source = fs.readFileSync(absolutePath, 'utf8');
  let ast;
  try {
    ast = espree.parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch {
    // resolveJsModule already reported the referenced file; a sibling that
    // does not parse fails at import time naming the file.
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

// Every module a _js reference names, plus the closure of their relative
// imports — a module that imports a shared helper must find it beside the copy.
function collectModuleFiles({ context }) {
  const roots = [
    ...Object.values(context.jsModules.client),
    ...Object.values(context.jsModules.server),
  ].map((mod) => mod.absolutePath);
  const files = new Set();
  const queue = [...roots];
  while (queue.length > 0) {
    const absolutePath = queue.shift();
    if (files.has(absolutePath)) continue;
    if (!fs.existsSync(absolutePath)) continue;
    if (path.relative(context.directories.config, absolutePath).startsWith('..')) continue;
    files.add(absolutePath);
    queue.push(...relativeImports(absolutePath));
  }
  return [...files].sort();
}

// The prod server directory must run with the config directory absent, so every
// referenced module is copied to <server>/<config-root relative path> — the
// location serverJsMap.js/clientJsMap.js import it from — together with the
// files it imports relatively. In dev the generated maps import the file in
// place so Vite serves and hot-replaces what the author edits.
async function copyJsModules({ context }) {
  if (context.stage !== 'prod') return;
  if (context.directories.config === context.directories.server) return;

  for (const absolutePath of collectModuleFiles({ context })) {
    const relativePath = path.relative(context.directories.config, absolutePath);
    const dest = path.resolve(context.directories.server, relativePath);
    try {
      await copyFileOrDirectory(absolutePath, dest);
    } catch (err) {
      // resolveJsModule verified the file exists, so a failure here is a broken
      // invariant, not a config fault.
      throw new LowdefyInternalError(
        `Failed to copy _js module "${relativePath}" to the server directory.`,
        { cause: err }
      );
    }
  }
}

export default copyJsModules;
