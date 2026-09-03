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
import { execFile } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Refs reach git as an argv entry, never through a shell, so this pattern is
// about rejecting nonsense early with a clear message rather than about
// quoting. It covers branch, tag and sha names plus the ^ and ~ suffixes.
const REF_PATTERN = /^[\w./@^~-]+$/;

async function git({ args, cwd }) {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}

// Two detached worktrees of the app's repository: the target ref, and the
// merge base of HEAD and that ref. The base tells an id that both branches
// added apart from an id that both branches merely have.
async function createAgainstWorktrees({ configDirectory, ref }) {
  if (!REF_PATTERN.test(ref)) {
    throw new Error(
      `Invalid git ref ${JSON.stringify(
        ref
      )}. A ref may only contain letters, digits and the characters _ - . / @ ^ ~.`
    );
  }
  const repoRoot = await git({ args: ['rev-parse', '--show-toplevel'], cwd: configDirectory });
  const againstCommit = await git({
    args: ['rev-parse', '--verify', `${ref}^{commit}`],
    cwd: repoRoot,
  });
  const baseCommit = await git({ args: ['merge-base', 'HEAD', againstCommit], cwd: repoRoot });
  // git reports the repository root with symlinks resolved (on macOS /tmp is a
  // symlink into /private/var), so the config directory has to be resolved the
  // same way or the path between them is not a path at all.
  const relativeConfig = path.relative(repoRoot, await fs.realpath(configDirectory));

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'lowdefy-check-against-'));
  const created = [];

  async function remove() {
    for (const directory of created) {
      await git({ args: ['worktree', 'remove', '--force', directory], cwd: repoRoot });
    }
    await fs.rm(root, { recursive: true, force: true });
  }

  try {
    for (const [name, commit] of [
      ['against', againstCommit],
      ['base', baseCommit],
    ]) {
      const directory = path.join(root, name);
      await git({ args: ['worktree', 'add', '--detach', directory, commit], cwd: repoRoot });
      created.push(directory);
    }
  } catch (error) {
    await remove();
    throw error;
  }

  return {
    againstDirectory: path.join(root, 'against', relativeConfig),
    baseDirectory: path.join(root, 'base', relativeConfig),
    remove,
  };
}

export default createAgainstWorktrees;
