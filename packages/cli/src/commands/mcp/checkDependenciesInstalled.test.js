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
import os from 'os';
import path from 'path';

import checkDependenciesInstalled from './checkDependenciesInstalled.js';

let base;

function writeJson(relativePath, value) {
  const filePath = path.join(base, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value));
}

function markCheckout(relativePath) {
  const directory = path.join(base, relativePath);
  fs.mkdirSync(path.join(directory, '.git'), { recursive: true });
  return directory;
}

beforeEach(() => {
  base = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-deps-')));
});

afterEach(() => {
  fs.rmSync(base, { recursive: true, force: true });
});

test('checkDependenciesInstalled names the install command and workspace root when lowdefy is not installed', () => {
  const root = markCheckout('repo');
  fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), '');
  writeJson('repo/apps/main/package.json', { devDependencies: { lowdefy: '7.1.0' } });
  const configDirectory = path.join(root, 'apps', 'main');

  expect(() => checkDependenciesInstalled({ configDirectory, root })).toThrow(
    `The dependencies of ${configDirectory} are not installed: a package.json in its checkout lists lowdefy, but no node_modules in ${root} has it. Run \`pnpm install\` in ${root}, then start the dev server again.`
  );
});

test('checkDependenciesInstalled passes when lowdefy is hoisted to the workspace root', () => {
  const root = markCheckout('repo');
  writeJson('repo/apps/main/package.json', { dependencies: { lowdefy: '7.1.0' } });
  writeJson('repo/node_modules/lowdefy/package.json', { name: 'lowdefy', version: '7.1.0' });

  expect(() =>
    checkDependenciesInstalled({ configDirectory: path.join(root, 'apps', 'main'), root })
  ).not.toThrow();
});

test('checkDependenciesInstalled refuses a worktree nested inside an installed checkout', () => {
  const parent = markCheckout('repo');
  writeJson('repo/package.json', { dependencies: { lowdefy: '7.1.0' } });
  writeJson('repo/node_modules/lowdefy/package.json', { name: 'lowdefy', version: '7.1.0' });
  fs.writeFileSync(path.join(parent, 'pnpm-lock.yaml'), '');
  const worktree = path.join(parent, '.claude', 'worktrees', 'agent-1');
  fs.mkdirSync(worktree, { recursive: true });
  // A linked worktree's .git is a file.
  fs.writeFileSync(path.join(worktree, '.git'), 'gitdir: ../../../.git/worktrees/agent-1\n');
  writeJson('repo/.claude/worktrees/agent-1/package.json', { dependencies: { lowdefy: '7.1.0' } });
  fs.writeFileSync(path.join(worktree, 'pnpm-lock.yaml'), '');

  expect(() => checkDependenciesInstalled({ configDirectory: worktree, root: worktree })).toThrow(
    `Run \`pnpm install\` in ${worktree}, then start the dev server again.`
  );
});

test('checkDependenciesInstalled ignores node_modules above the checkout root', () => {
  writeJson('node_modules/lowdefy/package.json', { name: 'lowdefy', version: '7.1.0' });
  const root = markCheckout('repo');
  writeJson('repo/package.json', { dependencies: { lowdefy: '7.1.0' } });

  expect(() => checkDependenciesInstalled({ configDirectory: root, root })).toThrow(
    `Run \`npm install\` in ${root}`
  );
});

test('checkDependenciesInstalled checks an app whose lowdefy is declared only at the monorepo root', () => {
  const root = markCheckout('repo');
  writeJson('repo/package.json', {
    packageManager: 'yarn@4.1.0',
    devDependencies: { lowdefy: '7' },
  });
  writeJson('repo/apps/main/package.json', { name: 'main', scripts: { dev: 'lowdefy dev' } });
  const configDirectory = path.join(root, 'apps', 'main');

  expect(() => checkDependenciesInstalled({ configDirectory, root })).toThrow(
    `Run \`yarn install\` in ${root}, then start the dev server again.`
  );
});

test("checkDependenciesInstalled lets a Yarn Plug'n'Play install through", () => {
  const root = markCheckout('repo');
  writeJson('repo/package.json', { packageManager: 'yarn@4.1.0', dependencies: { lowdefy: '7' } });
  fs.writeFileSync(path.join(root, 'yarn.lock'), '');
  fs.writeFileSync(path.join(root, '.pnp.cjs'), '');

  expect(() => checkDependenciesInstalled({ configDirectory: root, root })).not.toThrow();
});

test('checkDependenciesInstalled leaves an app that does not list lowdefy to its dev script', () => {
  const root = markCheckout('repo');
  writeJson('repo/package.json', { scripts: { dev: 'npx lowdefy@7 dev' } });

  expect(() => checkDependenciesInstalled({ configDirectory: root, root })).not.toThrow();
});

test('checkDependenciesInstalled ignores a package.json above the checkout root that lists lowdefy', () => {
  writeJson('package.json', { dependencies: { lowdefy: '7' } });
  const root = markCheckout('repo');

  expect(() => checkDependenciesInstalled({ configDirectory: root, root })).not.toThrow();
});
