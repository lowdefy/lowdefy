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

import { builtinModules } from 'node:module';
import path from 'node:path';

import listImportSpecifiers from './listImportSpecifiers.mjs';

const sourceFilePattern = /\.(c|m)?jsx?$/;
const testFilePattern = /\.(test|spec)\.(c|m)?jsx?$|(^|\/)(test|tests|test-utils|__mocks__)\//;
const packageNamePattern = /^(@[\w~-][\w.~-]*\/)?[\w~-][\w.~-]*$/;

// Published files that may import devDependencies, because whoever runs them has
// installed those as well.
const devDependencyFiles = {
  // The server build step runs from the server's own install, before any production prune.
  '@lowdefy/server': /^lowdefy\//,
  '@lowdefy/server-e2e': /^lowdefy\//,
  // webpack bundles these imports into dist.
  '@lowdefy/nunjucks': /^src\//,
};

function toPackageName(specifier) {
  const parts = specifier.split('/');
  const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  if (!packageNamePattern.test(name) || builtinModules.includes(name)) {
    return null;
  }
  return name;
}

function findPackageDirectory({ filePath, packages }) {
  let directory = path.posix.dirname(filePath);
  while (!packages.has(directory)) {
    if (directory === '.') return null;
    directory = path.posix.dirname(directory);
  }
  return directory;
}

function matchesFilesEntry({ entry, relativePath }) {
  const pattern = entry
    .replace(/\/\**$/, '')
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/]*');
  return new RegExp(`^${pattern}(/|$)`).test(relativePath);
}

// Packages publish dist/, which swc (or webpack) builds from src/.
function isPublished({ packageJson, relativePath }) {
  if (!Array.isArray(packageJson.files)) return true;
  const builtPath = relativePath.replace(/^src\//, 'dist/');
  return packageJson.files.some(
    (entry) =>
      matchesFilesEntry({ entry, relativePath }) ||
      matchesFilesEntry({ entry, relativePath: builtPath })
  );
}

// Block packages export e2e helpers that only run inside an app's Playwright tests, where
// the app provides @playwright/test and @lowdefy/e2e-utils.
function listE2eHelperFiles({ importsByFile, packageDirectory, packageJson }) {
  const helpers = new Set();
  const entry = packageJson.exports?.['./e2e'];
  if (typeof entry !== 'string') return helpers;
  const queue = [path.posix.join(packageDirectory, entry.replace(/^(\.\/)?dist\//, 'src/'))];
  while (queue.length > 0) {
    const filePath = queue.pop();
    if (helpers.has(filePath) || !importsByFile.has(filePath)) continue;
    helpers.add(filePath);
    importsByFile
      .get(filePath)
      .filter((specifier) => specifier.startsWith('.'))
      .forEach((specifier) => {
        queue.push(path.posix.join(path.posix.dirname(filePath), specifier));
      });
  }
  return helpers;
}

function mayUseDevDependencies({ e2eHelperFiles, filePath, packageDirectory, packageJson }) {
  const relativePath = path.posix.relative(packageDirectory, filePath);
  return (
    packageJson.private === true ||
    testFilePattern.test(relativePath) ||
    !isPublished({ packageJson, relativePath }) ||
    devDependencyFiles[packageJson.name]?.test(relativePath) === true ||
    e2eHelperFiles.has(filePath)
  );
}

function findUndeclaredImports({ files }) {
  const packages = new Map();
  const importsByFile = new Map();
  Object.entries(files).forEach(([filePath, content]) => {
    if (path.posix.basename(filePath) === 'package.json') {
      packages.set(path.posix.dirname(filePath), JSON.parse(content));
      return;
    }
    if (!sourceFilePattern.test(filePath)) return;
    try {
      importsByFile.set(filePath, listImportSpecifiers({ source: content }));
    } catch (error) {
      throw new Error(`Could not parse ${filePath}: ${error.message}`);
    }
  });

  const e2eHelperFiles = new Set(
    [...packages].flatMap(([packageDirectory, packageJson]) => [
      ...listE2eHelperFiles({ importsByFile, packageDirectory, packageJson }),
    ])
  );

  const problems = [];
  importsByFile.forEach((specifiers, filePath) => {
    const packageDirectory = findPackageDirectory({ filePath, packages });
    if (packageDirectory === null) {
      problems.push({ filePath, problem: 'outsidePackage' });
      return;
    }
    const packageJson = packages.get(packageDirectory);
    const runtime = new Set([
      packageJson.name,
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.peerDependencies ?? {}),
      ...Object.keys(packageJson.optionalDependencies ?? {}),
    ]);
    const development = new Set(Object.keys(packageJson.devDependencies ?? {}));
    const devAllowed = mayUseDevDependencies({
      e2eHelperFiles,
      filePath,
      packageDirectory,
      packageJson,
    });
    new Set(specifiers.map(toPackageName)).forEach((name) => {
      if (name === null || runtime.has(name)) return;
      if (development.has(name)) {
        if (!devAllowed) problems.push({ filePath, name, problem: 'devDependency' });
        return;
      }
      problems.push({ filePath, name, problem: 'undeclared' });
    });
  });
  return problems;
}

export default findUndeclaredImports;
