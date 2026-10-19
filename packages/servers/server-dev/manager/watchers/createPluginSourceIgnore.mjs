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

const CODE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json']);

// Watched packages are resolved to their real paths, which chokidar reports,
// so the directories compared with them must be too (a config directory
// reached through a symlink, or macOS's /var -> /private/var).
function realPath(dir) {
  return fs.existsSync(dir) ? fs.realpathSync(dir) : dir;
}

function statIfExists(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    // Already gone (an unlink): a removed directory's files are reported on their own.
    return null;
  }
}

function isInside({ filePath, dir }) {
  const relative = path.relative(dir, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

// Only plugin code (and package.json, or a type list kept in JSON) can change
// what the config build reads from a plugin. Everything else in a watched
// package is ignored by path, without knowing who wrote it: a plugin package
// that is also the config directory has its YAML and Markdown watched by the
// config watcher already, and its ref resolvers write public/ on every build,
// which would otherwise trigger the next build, forever. The build, staging
// and server directories hold the build's own output.
function createPluginSourceIgnore({ directories }) {
  const ignoredDirs = [
    path.join(directories.config, 'public'),
    directories.build,
    directories.buildStaging,
    directories.server,
  ]
    .filter(Boolean)
    .map(realPath);
  return function isIgnored(filePath, stats) {
    if (filePath.split(path.sep).includes('node_modules')) {
      return true;
    }
    if (ignoredDirs.some((dir) => isInside({ filePath, dir }))) {
      return true;
    }
    const extension = path.extname(filePath);
    if (CODE_EXTENSIONS.has(extension)) {
      return false;
    }
    // chokidar asks about directories too, often without their stats, and a
    // directory must not be ignored, or nothing under it is watched.
    const pathStats = stats ?? statIfExists(filePath);
    return pathStats?.isDirectory() !== true;
  };
}

export default createPluginSourceIgnore;
