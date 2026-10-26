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
import { createRequire } from 'module';
import path from 'path';

// The build's plugin import files the client bundles. Every other file under
// build/plugins is imported by the server process, which caches the modules.
const CLIENT_IMPORT_FILES = new Set([
  'actions.js',
  'blocks.js',
  'icons.js',
  path.join('operators', 'client.js'),
  path.join('operators', 'clientJsMap.js'),
]);

const RESOLVE_EXTENSIONS = ['', '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json'];

// Static imports and re-exports, side-effect imports, and literal dynamic
// imports and requires. A match inside a comment or string only adds a file,
// which at worst restarts the server when it did not need to.
const SPECIFIER_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*[,)]/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];
const DYNAMIC_IMPORT = /\b(import|require)\s*\(/g;
// Block comments, and line comments not inside a URL such as 'https://...'.
const COMMENTS = /\/\*[\s\S]*?\*\/|(^|[^:'"\w])\/\/[^\n]*/g;
const LITERAL_DYNAMIC_IMPORT = /^\s*['"][^'"]+['"]\s*[,)]/;

function listFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
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

function findPackage({ packages, specifier }) {
  return packages.find(
    ({ package: name }) => specifier === name || specifier.startsWith(`${name}/`)
  );
}

function resolveRelative({ from, specifier }) {
  const base = path.resolve(path.dirname(from), specifier);
  const candidates = [
    ...RESOLVE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...RESOLVE_EXTENSIONS.slice(1).map((extension) => path.join(base, `index${extension}`)),
  ];
  const found = candidates.find((candidate) =>
    fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()
  );
  return found ? fs.realpathSync(found) : null;
}

// The files of the local plugin packages the server process imports: walked
// from the build's server-side plugin import files through each module's
// imports, staying inside the local packages (published dependencies cannot
// change under a running dev server). Returns null when the walk cannot be
// sure - an import it cannot resolve, or a dynamic import of a computed path -
// so the caller restarts as it would without the walk.
function listServerPluginFiles({ directories, packages }) {
  const requireFromServer = createRequire(path.join(directories.server, 'package.json'));
  const pluginsDir = path.join(directories.build, 'plugins');
  const files = new Set();
  const queue = [];

  for (const importFile of listFiles(pluginsDir)) {
    const relative = path.relative(pluginsDir, importFile);
    if (path.extname(importFile) !== '.js' || CLIENT_IMPORT_FILES.has(relative)) {
      continue;
    }
    for (const specifier of readSpecifiers(fs.readFileSync(importFile, 'utf8'))) {
      if (findPackage({ packages, specifier })) {
        queue.push({ specifier, from: null });
      }
    }
  }

  while (queue.length > 0) {
    const { specifier, from } = queue.shift();
    let filePath;
    if (specifier.startsWith('.')) {
      filePath = resolveRelative({ from, specifier });
    } else if (findPackage({ packages, specifier })) {
      try {
        filePath = fs.realpathSync(requireFromServer.resolve(specifier));
      } catch {
        filePath = null;
      }
    } else {
      continue;
    }
    if (filePath === null) {
      return null;
    }
    if (files.has(filePath)) {
      continue;
    }
    files.add(filePath);
    if (path.extname(filePath) === '.json') {
      continue;
    }
    const source = fs.readFileSync(filePath, 'utf8').replace(COMMENTS, '$1');
    if (hasNonLiteralDynamicImport(source)) {
      return null;
    }
    for (const next of readSpecifiers(source)) {
      queue.push({ specifier: next, from: filePath });
    }
  }
  return files;
}

export default listServerPluginFiles;
