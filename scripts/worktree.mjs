#!/usr/bin/env node
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
  Create a ready-to-test git worktree: checked out, installed and built.

  Usage:
    pnpm worktree fix/my-change                          # new branch off origin/<current branch>
    pnpm worktree fix/my-change --base origin/v7         # new branch off a given ref
    pnpm worktree feat/existing-branch                   # check out an existing branch
    pnpm worktree fix/my-change --dir ../somewhere --skip-build

  The worktree lands next to the main checkout as ../lowdefy-wt-<branch-slug> unless
  --dir is given. Everything expensive is already shared between worktrees, so a new one
  is ready in well under a minute:
    - pnpm packages come from the global content-addressed store (--prefer-offline),
    - MongoDB test binaries are cached in ~/.cache/mongodb-binaries,
    - Playwright browsers are cached in the user's ms-playwright cache.
  Per worktree state (node_modules, dist, _server/, .lowdefy/) never crosses over.
*/

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

function run(command, args, { cwd, capture = false } = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function git(args, { cwd, capture = true } = {}) {
  return run('git', args, { cwd, capture })?.trim();
}

function refExists(ref, cwd) {
  try {
    git(['rev-parse', '--verify', '--quiet', ref], { cwd });
    return true;
  } catch {
    return false;
  }
}

function defaultBase(cwd) {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd });
  if (branch === 'HEAD') {
    throw new Error('Detached HEAD: pass --base <ref> to choose the base of the new branch.');
  }
  return `origin/${branch}`;
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    base: { type: 'string' },
    dir: { type: 'string' },
    'skip-build': { type: 'boolean', default: false },
  },
});

const branch = positionals[0];
if (!branch) {
  console.error('Usage: pnpm worktree <branch> [--base <ref>] [--dir <path>] [--skip-build]');
  process.exit(1);
}

const cwd = process.cwd();
// The main checkout is the parent of the shared .git directory, even when this runs
// from inside another worktree.
const mainCheckout = path.dirname(
  path.resolve(cwd, git(['rev-parse', '--git-common-dir'], { cwd }))
);
const dir = path.resolve(
  values.dir ?? path.join(path.dirname(mainCheckout), `lowdefy-wt-${branch.replace(/\//g, '-')}`)
);

if (existsSync(dir)) {
  console.error(`${dir} already exists. Pick another --dir or remove it first.`);
  process.exit(1);
}

git(['fetch', 'origin', '--quiet'], { cwd, capture: false });

if (refExists(`refs/heads/${branch}`, cwd)) {
  console.log(`Checking out existing branch ${branch} in ${dir}`);
  git(['worktree', 'add', dir, branch], { cwd, capture: false });
} else if (refExists(`refs/remotes/origin/${branch}`, cwd)) {
  console.log(`Tracking origin/${branch} in ${dir}`);
  git(['worktree', 'add', '--track', '-b', branch, dir, `origin/${branch}`], {
    cwd,
    capture: false,
  });
} else {
  const base = values.base ?? defaultBase(cwd);
  console.log(`Creating ${branch} from ${base} in ${dir}`);
  git(['worktree', 'add', '--no-track', '-b', branch, dir, base], { cwd, capture: false });
}

console.log('\nInstalling dependencies...');
run('pnpm', ['install', '--frozen-lockfile', '--prefer-offline'], { cwd: dir });

if (!values['skip-build']) {
  console.log('\nBuilding packages...');
  run('pnpm', ['build'], { cwd: dir });
}

console.log(`
Worktree ready: ${dir}
  Branch:    ${branch}
  Tests:     pnpm --filter=<package> test --testPathPattern=<name> --no-coverage
  MongoDB:   pnpm test:mongodb
  Dev app:   pnpm app:dev --no-open --port <free port>
  Remove:    git worktree remove ${dir}
See code-docs/testing.md for the full testing guide.`);
