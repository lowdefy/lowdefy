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

/*
  Fails when a workspace package imports a package its package.json does not declare.

  In the monorepo such an import still resolves through another package's install, so
  tests and builds pass, and the published package breaks for users (or here, once the
  lockfile shifts). Published files may only import dependencies, peerDependencies and
  optionalDependencies; tests, e2e helpers and unpublished scripts may also import
  devDependencies. Runs first in `pnpm test`, in about a second.

  Usage: pnpm test:dependencies
*/

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import findUndeclaredImports from './lib/findUndeclaredImports.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = Object.fromEntries(
  execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'packages'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\n')
    .filter((filePath) => /(\.(c|m)?jsx?|(^|\/)package\.json)$/.test(filePath))
    .filter((filePath) => fs.existsSync(path.join(repoRoot, filePath)))
    .map((filePath) => [filePath, fs.readFileSync(path.join(repoRoot, filePath), 'utf8')])
);

const messages = {
  devDependency: ({ filePath, name }) =>
    `${filePath} imports "${name}", which is only a devDependency. This file is published, so declare it in dependencies (or peerDependencies).`,
  outsidePackage: ({ filePath }) =>
    `${filePath} is not inside a workspace package (no package.json above it).`,
  undeclared: ({ filePath, name }) =>
    `${filePath} imports "${name}", which its package.json does not declare.`,
};

const problems = findUndeclaredImports({ files });

if (problems.length > 0) {
  console.error(`Found ${problems.length} undeclared import(s):\n`);
  problems.forEach((problem) => console.error(`  ${messages[problem.problem](problem)}`));
  process.exit(1);
}
console.log(`Dependency check passed (${Object.keys(files).length} files).`);
