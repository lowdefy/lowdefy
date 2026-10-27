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

// The conditions Vite's SSR resolver matches for an import in the dev server
// (ssr.resolve.conditions in development, plus 'import'), so a package that
// exports a CommonJS build beside its ES modules resolves to the modules the
// server loads.
const CONDITIONS = new Set(['default', 'development', 'import', 'module', 'node']);

function resolveTarget(target) {
  if (type.isString(target)) {
    return target;
  }
  if (type.isArray(target)) {
    for (const item of target) {
      const resolved = resolveTarget(item);
      if (resolved !== null) {
        return resolved;
      }
    }
    return null;
  }
  if (type.isObject(target)) {
    for (const [condition, value] of Object.entries(target)) {
      if (CONDITIONS.has(condition)) {
        const resolved = resolveTarget(value);
        if (resolved !== null) {
          return resolved;
        }
      }
    }
  }
  return null;
}

// An exact key wins; otherwise the pattern key with the longest prefix before
// its '*', the order Node and Vite match subpath patterns in.
function matchSubpath({ map, subpath }) {
  if (Object.hasOwn(map, subpath)) {
    return resolveTarget(map[subpath]);
  }
  let best = null;
  for (const key of Object.keys(map)) {
    const star = key.indexOf('*');
    if (star === -1) {
      continue;
    }
    const prefix = key.slice(0, star);
    const suffix = key.slice(star + 1);
    const matches =
      subpath.length >= prefix.length + suffix.length &&
      subpath.startsWith(prefix) &&
      subpath.endsWith(suffix);
    if (matches && (best === null || prefix.length > best.prefix.length)) {
      best = { key, prefix, value: subpath.slice(prefix.length, subpath.length - suffix.length) };
    }
  }
  if (best === null) {
    return null;
  }
  const target = resolveTarget(map[best.key]);
  return target === null ? null : target.replaceAll('*', best.value);
}

// exports is either a subpath map ({ './connections': ... }) or the target of
// the package root alone (a string, an array or a conditions object).
function exportsMap(exports) {
  if (type.isObject(exports) && Object.keys(exports).some((key) => key.startsWith('.'))) {
    return exports;
  }
  return { '.': exports };
}

// Where a local package's own specifier leads: a package subpath
// ('@app/plugin/connections') through the package's exports, or a
// subpath import ('#lib/query.js') through its imports. Returns { filePath },
// { specifier } when an import names another package, or null when the
// package does not map the specifier or the file it names is missing.
function resolvePackageSpecifier({ dir, packageName, specifier }) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  let target;
  if (specifier.startsWith('#')) {
    target = matchSubpath({ map: packageJson.imports ?? {}, subpath: specifier });
  } else {
    const subpath = `.${specifier.slice(packageName.length)}`;
    if (type.isNone(packageJson.exports)) {
      const main = packageJson.module ?? packageJson.main ?? './index.js';
      target = subpath === '.' ? `./${path.posix.normalize(main)}` : subpath;
    } else {
      target = matchSubpath({ map: exportsMap(packageJson.exports), subpath });
    }
  }
  if (target === null) {
    return null;
  }
  if (target.startsWith('./')) {
    const filePath = resolveFile(path.resolve(dir, target));
    return filePath === null ? null : { filePath };
  }
  // As in Node, only an import may name another package, and not through
  // another subpath import.
  if (specifier.startsWith('#') && !target.startsWith('#')) {
    return { specifier: target };
  }
  return null;
}

export default resolvePackageSpecifier;
