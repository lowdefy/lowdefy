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

import runGit from './runGit.js';

// The base commit's whole repository, checked out into
// <scopeDirectory>/trees/<sha>/ and kept as a cache. The whole repository,
// not only the app, because _refs and local modules can reach outside the
// app directory. Returns the base config directory: the same path relative
// to the git root as the head's.
//
// The tree is read into a temporary index and checked out from there, not
// extracted with `git archive` or `git worktree add`. `git archive` applies
// .gitattributes export rules (export-ignore paths go missing, export-subst
// files are rewritten) and skips checkout filters such as LFS smudge, so its
// output can differ from the commit. `git worktree add` registers a worktree
// that `git worktree list` (and the hub's checkout guard) would then see. A
// temporary-index checkout writes exactly the commit's tree, runs the
// repository's checkout filters and registers nothing.
async function materialiseTree({ root, sha, configDirectory, scopeDirectory }) {
  const treesDirectory = path.join(scopeDirectory, 'trees');
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
  const indexPath = path.resolve(`${partialDirectory}.index`);
  const env = { GIT_INDEX_FILE: indexPath };
  await fs.promises.rm(partialDirectory, { recursive: true, force: true });
  await fs.promises.mkdir(partialDirectory, { recursive: true });
  try {
    await runGit({ args: ['read-tree', sha], cwd: root, env });
    // The trailing separator makes the prefix a directory, not a file name prefix.
    await runGit({
      args: ['checkout-index', '-a', `--prefix=${path.resolve(partialDirectory)}${path.sep}`],
      cwd: root,
      env,
    });
    await fs.promises.rename(partialDirectory, treeDirectory);
  } finally {
    await fs.promises.rm(indexPath, { force: true });
    await fs.promises.rm(partialDirectory, { recursive: true, force: true });
  }
  return { ...result, cached: false };
}

export default materialiseTree;
