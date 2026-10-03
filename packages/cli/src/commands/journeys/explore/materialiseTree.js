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
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import runGit from './runGit.js';

const execFileAsync = promisify(execFile);

// The base commit's whole repository, extracted with `git archive` into
// <exploreDirectory>/trees/<sha>/ and kept as a cache. The whole repository,
// not only the app, because _refs and local modules can reach outside the
// app directory. Archiving registers no worktree, so `git worktree list` is
// untouched. Returns the base config directory: the same path relative to
// the git root as the head's.
async function materialiseTree({ root, sha, configDirectory, exploreDirectory }) {
  const treesDirectory = path.join(exploreDirectory, 'trees');
  const treeDirectory = path.join(treesDirectory, sha);
  const relativeConfig = path.relative(fs.realpathSync(root), fs.realpathSync(configDirectory));
  const result = {
    treeDirectory,
    configDirectory: path.join(treeDirectory, relativeConfig),
  };
  if (fs.existsSync(treeDirectory)) {
    return { ...result, cached: true };
  }
  // Extracted beside the cache and renamed into place, so an interrupted
  // extract never reads as a cached tree.
  const partialDirectory = `${treeDirectory}.partial-${process.pid}`;
  const archivePath = `${partialDirectory}.tar`;
  await fs.promises.rm(partialDirectory, { recursive: true, force: true });
  await fs.promises.mkdir(partialDirectory, { recursive: true });
  try {
    await runGit({ args: ['archive', '--format=tar', '-o', archivePath, sha], cwd: root });
    await execFileAsync('tar', ['-xf', archivePath, '-C', partialDirectory]);
    await fs.promises.rename(partialDirectory, treeDirectory);
  } finally {
    await fs.promises.rm(archivePath, { force: true });
    await fs.promises.rm(partialDirectory, { recursive: true, force: true });
  }
  return { ...result, cached: false };
}

export default materialiseTree;
