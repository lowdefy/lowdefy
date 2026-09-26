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

import path from 'path';

function findWatchRoot({ filePath, watchPaths }) {
  let watchRoot;
  for (const watchPath of watchPaths) {
    const contains = filePath === watchPath || filePath.startsWith(`${watchPath}${path.sep}`);
    if (contains && (watchRoot === undefined || watchPath.length > watchRoot.length)) {
      watchRoot = watchPath;
    }
  }
  return watchRoot;
}

// Ignores a path with a segment that starts with a dot (.git, .lowdefy, .env
// files). Segments are counted from the watched path the file is under, not
// from the file system root, so an app that lives inside a dot-folder (a git
// worktree under .claude/worktrees/) is still watched. A path under no watched
// path is a file added to the watch on its own, so only its name is tested.
function createDotPathIgnore({ watchPaths }) {
  return function isDotPath(filePath) {
    const watchRoot = findWatchRoot({ filePath, watchPaths });
    const relativePath =
      watchRoot === undefined ? path.basename(filePath) : path.relative(watchRoot, filePath);
    return relativePath.split(path.sep).some((segment) => segment.startsWith('.'));
  };
}

export default createDotPathIgnore;
