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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import setupWatcher from '../utils/setupWatcher.mjs';

function readModuleList(artifactPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Before the first build, or mid-write.
    return [];
  }
}

// Both artefacts list absolute paths of files the server process imports and
// holds in its ESM cache: js/serverModules.json the modules _js references
// name, js/serverFilePlugins.json the server-side and build file plugins.
export function readServerModules(artifactPaths) {
  const paths = Array.isArray(artifactPaths) ? artifactPaths : [artifactPaths];
  return [...new Set(paths.flatMap(readModuleList))].sort();
}

function sha1(filePath) {
  try {
    return crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('base64');
  } catch {
    // Deleted or mid-write; the next event re-hashes it.
    return null;
  }
}

function hashAll(paths) {
  const hashes = {};
  for (const filePath of paths) {
    hashes[filePath] = sha1(filePath);
  }
  return hashes;
}

// The server imports the modules that _js references name (serverJsMap.js) and
// the server-side file plugins (plugins/operators/server.js), so an edit to one
// needs a fresh process — the ESM cache holds the old copy. writeJs lists the
// first set in build/js/serverModules.json and writeServerFilePlugins the
// second in build/js/serverFilePlugins.json; watching the artefacts too lets a
// build that adds a module extend the watch set. Module contents are
// hashed so an editor's double save, a no-op rebuild of the artefact, or a late
// creation event never restarts a server whose imports did not change.
// serverArtifactWatcher deliberately does not track these: user source files
// are a different signal with a different rule.
function jsModuleWatcher(context) {
  const jsDir = path.join(context.directories.build, 'js');
  const artifactPaths = [
    path.join(jsDir, 'serverModules.json'),
    path.join(jsDir, 'serverFilePlugins.json'),
  ];
  let hashes = hashAll(readServerModules(artifactPaths));
  let watcher;

  const callback = async () => {
    const current = readServerModules(artifactPaths);
    const previous = Object.keys(hashes);
    const added = current.filter((filePath) => !previous.includes(filePath));
    const removed = previous.filter((filePath) => !current.includes(filePath));
    const next = hashAll(current);
    const contentChanged = current.some((filePath) => next[filePath] !== hashes[filePath]);
    hashes = next;
    if (watcher) {
      if (added.length > 0) {
        watcher.add(added);
      }
      // A module dropped from the artifact is also dropped from `hashes`, so
      // the ignore predicate would reject its events from here on - leaving a
      // watch on a file nothing reads. Long dev sessions add and remove
      // modules repeatedly.
      if (removed.length > 0) {
        watcher.unwatch(removed);
      }
    }
    if (added.length === 0 && removed.length === 0 && !contentChanged) {
      return;
    }
    context.logger.info(
      { spin: 'start' },
      'Server-side _js module or file plugin changed - restarting server.'
    );
    await context.restartServer();
  };

  // chokidar on inotify never emits for a file path that does not exist yet,
  // and build/js/ is only created by the first build - so watch the build
  // directory and admit only the artifact and the listed module files (the
  // same pattern restartRequestWatcher uses for its sentinel).
  return setupWatcher({
    callback,
    context,
    watchDotfiles: true,
    watchPaths: [context.directories.build, ...Object.keys(hashes)],
    ignorePaths: [
      (filePath) =>
        filePath !== context.directories.build &&
        filePath !== jsDir &&
        !artifactPaths.includes(filePath) &&
        hashes[filePath] === undefined,
    ],
  }).then((created) => {
    watcher = created;
    return created;
  });
}

export default jsModuleWatcher;
