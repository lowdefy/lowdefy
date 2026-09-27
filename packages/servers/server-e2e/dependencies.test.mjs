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
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The CLI installs this server on its own, outside the monorepo, so a package
// its files import resolves only when package.json declares it.
const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8')
);

const importPattern =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)['"]([@a-z][^'"]*)['"]/g;

function listSourceFiles(filePath) {
  if (fs.statSync(filePath).isDirectory()) {
    return fs.readdirSync(filePath).flatMap((entry) => listSourceFiles(path.join(filePath, entry)));
  }
  return /\.(c|m)?jsx?$/.test(filePath) && !/\.test\.m?js$/.test(filePath) ? [filePath] : [];
}

function toPackageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

test('every package the published files import is declared in package.json', () => {
  const declared = new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
  ]);
  const publishedFiles = packageJson.files
    .map((entry) => path.join(packageDirectory, entry.replace(/\/\*$/, '')))
    .filter((filePath) => fs.existsSync(filePath))
    .flatMap(listSourceFiles);

  const undeclared = new Set();
  for (const filePath of publishedFiles) {
    for (const [, specifier] of fs.readFileSync(filePath, 'utf8').matchAll(importPattern)) {
      const name = toPackageName(specifier);
      if (!name.startsWith('node:') && !builtinModules.includes(name) && !declared.has(name)) {
        undeclared.add(`${name} (${path.relative(packageDirectory, filePath)})`);
      }
    }
  }

  expect([...undeclared]).toEqual([]);
});
