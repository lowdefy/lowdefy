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

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import setUpOnce from './setUpOnce.mjs';

function git({ args, cwd }) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
}

function resolveBaselineSha({ ref, repoRoot }) {
  if (ref) {
    return git({ args: ['rev-parse', '--verify', `${ref}^{commit}`], cwd: repoRoot });
  }
  return git({ args: ['merge-base', 'HEAD', 'origin/develop'], cwd: repoRoot });
}

// Beside the main checkout, as scripts/worktree.mjs places worktrees.
function getBaselineDirectory({ repoRoot, sha }) {
  const commonDir = path.resolve(
    repoRoot,
    git({ args: ['rev-parse', '--git-common-dir'], cwd: repoRoot })
  );
  const mainCheckout = path.dirname(commonDir);
  return path.join(path.dirname(mainCheckout), `lowdefy-bench-${sha.slice(0, 7)}`);
}

function run({ command, args, cwd }) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function removeWorktree({ directory, repoRoot }) {
  try {
    git({ args: ['worktree', 'remove', '--force', directory], cwd: repoRoot });
  } catch {
    // Not (or no longer) a registered worktree: remove the folder and drop
    // any stale registration.
    fs.rmSync(directory, { recursive: true, force: true });
    git({ args: ['worktree', 'prune'], cwd: repoRoot });
  }
}

// Several harness runs may need the same baseline at once; setUpOnce lets one
// of them create, install and build it while the others wait.
async function ensureBaselineWorktree({ logger, ref, repoRoot }) {
  const sha = resolveBaselineSha({ ref, repoRoot });
  const directory = getBaselineDirectory({ repoRoot, sha });

  const { reused } = await setUpOnce({
    directory,
    logger,
    sha,
    create: () => {
      if (fs.existsSync(directory)) {
        logger.warn(`Baseline worktree ${directory} was not finished; rebuilding it.`);
        removeWorktree({ directory, repoRoot });
      }
      logger.info(`Creating baseline worktree ${directory} at ${sha.slice(0, 7)}.`);
      git({ args: ['worktree', 'add', '--detach', directory, sha], cwd: repoRoot });
      run({
        command: 'pnpm',
        args: ['install', '--frozen-lockfile', '--prefer-offline'],
        cwd: directory,
      });
      run({ command: 'pnpm', args: ['build'], cwd: directory });
    },
  });
  if (reused) {
    logger.info(`Reusing baseline worktree ${directory} at ${sha.slice(0, 7)}.`);
  }
  return { directory, reused, sha };
}

export default ensureBaselineWorktree;
