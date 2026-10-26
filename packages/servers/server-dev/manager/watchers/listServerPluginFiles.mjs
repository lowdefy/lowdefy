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
import { type } from '@lowdefy/helpers';

import resolveFile from './resolveFile.mjs';
import resolvePackageSpecifier from './resolvePackageSpecifier.mjs';

// The build's plugin import files the client bundles. Every other file under
// build/plugins is imported by the server process, which caches the modules.
// A file missing here is walked as server code, which errs towards a restart.
const CLIENT_IMPORT_FILES = new Set([
  'actions.js',
  'blocks.js',
  'icons.js',
  path.join('operators', 'client.js'),
  path.join('operators', 'clientJsMap.js'),
]);

// Static imports and re-exports, side-effect imports, and literal dynamic
// imports and requires. A match inside a string adds a file, or marks its
// package unsure when it names none, so at worst the server restarts when it
// did not need to.
const SPECIFIER_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*[,)]/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];
const DYNAMIC_IMPORT = /\b(import|require)\s*\(/g;
const LITERAL_DYNAMIC_IMPORT = /^\s*['"][^'"]+['"]\s*[,)]/;
// String literals are matched so the comment markers inside them ('**/*.js',
// 'https://...') stay text; only the comments are removed. Quoted strings end
// at a line end, so a quote misread as one (an apostrophe in a regular
// expression) cannot swallow the lines after it.
const STRINGS_AND_COMMENTS =
  /('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\[\s\S]|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g;

function isInside({ filePath, dir }) {
  const relative = path.relative(dir, filePath);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function stripComments(source) {
  return source.replace(STRINGS_AND_COMMENTS, (_, string) => string ?? '');
}

function readSpecifiers(source) {
  const specifiers = [];
  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function hasNonLiteralDynamicImport(source) {
  for (const match of source.matchAll(DYNAMIC_IMPORT)) {
    const rest = source.slice(match.index + match[0].length);
    if (!LITERAL_DYNAMIC_IMPORT.test(rest)) {
      return true;
    }
  }
  return false;
}

function findPackageByName({ packages, specifier }) {
  return packages.find(
    ({ package: name }) => specifier === name || specifier.startsWith(`${name}/`)
  );
}

function findPackageByFile({ packages, filePath }) {
  return packages.find(({ dir }) => isInside({ filePath, dir }));
}

// Where a specifier leads, and the local package it resolves in, or null for
// a published dependency, which cannot change under a running dev server.
// Relative and subpath ('#lib/query.js') imports resolve in the importer's
// own package.
function resolveSpecifier({ packages, specifier, from }) {
  if (specifier.startsWith('.')) {
    const filePath = resolveFile(path.resolve(path.dirname(from), specifier));
    return {
      owner: findPackageByFile({ packages, filePath: from }),
      resolved: filePath === null ? null : { filePath },
    };
  }
  const owner = specifier.startsWith('#')
    ? findPackageByFile({ packages, filePath: from })
    : findPackageByName({ packages, specifier });
  if (owner === undefined) {
    return null;
  }
  return {
    owner,
    resolved: resolvePackageSpecifier({ dir: owner.dir, packageName: owner.package, specifier }),
  };
}

// The files of the local plugin packages the server process imports: walked
// from the build's server-side plugin import files through each module's
// imports, staying inside the local packages. A package where the walk cannot
// be sure - an import it cannot resolve, or a dynamic import of a computed
// path - is listed in unsureDirs, and any change to it restarts the server as
// it would without the walk.
function listServerPluginFiles({ directories, packages }) {
  const pluginsDir = path.join(directories.build, 'plugins');
  const files = new Set();
  const unsureDirs = new Set();
  const queue = [];

  for (const importFile of listFiles(pluginsDir)) {
    const relative = path.relative(pluginsDir, importFile);
    if (path.extname(importFile) !== '.js' || CLIENT_IMPORT_FILES.has(relative)) {
      continue;
    }
    for (const specifier of readSpecifiers(fs.readFileSync(importFile, 'utf8'))) {
      if (findPackageByName({ packages, specifier })) {
        queue.push({ specifier, from: null });
      }
    }
  }

  while (queue.length > 0) {
    const { specifier, from } = queue.shift();
    const result = resolveSpecifier({ packages, specifier, from });
    if (result === null) {
      continue;
    }
    const { owner, resolved } = result;
    if (resolved === null) {
      unsureDirs.add(owner.dir);
      continue;
    }
    if (!type.isNone(resolved.specifier)) {
      queue.push({ specifier: resolved.specifier, from });
      continue;
    }
    const { filePath } = resolved;
    const filePackage = findPackageByFile({ packages, filePath });
    // A file outside every local package is not watched, so it cannot
    // restart the server either way.
    if (filePackage === undefined || files.has(filePath)) {
      continue;
    }
    files.add(filePath);
    if (path.extname(filePath) === '.json') {
      continue;
    }
    const source = stripComments(fs.readFileSync(filePath, 'utf8'));
    if (hasNonLiteralDynamicImport(source)) {
      unsureDirs.add(filePackage.dir);
    }
    for (const next of readSpecifiers(source)) {
      queue.push({ specifier: next, from: filePath });
    }
  }
  return { files, unsureDirs };
}

export default listServerPluginFiles;
