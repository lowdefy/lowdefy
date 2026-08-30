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

export function readServerModules(artifactPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Before the first build, or mid-write.
    return [];
  }
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

// The server imports the modules that _js references name (serverJsMap.js), so
// an edit to one needs a fresh process — the ESM cache holds the old copy.
// writeJs lists them in build/js/serverModules.json; watching the artefact too
// lets a build that adds a module extend the watch set. Module contents are
// hashed so an editor's double save, a no-op rebuild of the artefact, or a late
// creation event never restarts a server whose imports did not change.
// serverArtifactWatcher deliberately does not track these: user source files
// are a different signal with a different rule.
function jsModuleWatcher(context) {
  const artifactPath = path.join(context.directories.build, 'js', 'serverModules.json');
  let hashes = hashAll(readServerModules(artifactPath));
  let watcher;

  const callback = async () => {
    const current = readServerModules(artifactPath);
    const previous = Object.keys(hashes);
    const added = current.filter((filePath) => !previous.includes(filePath));
    const removed = previous.filter((filePath) => !current.includes(filePath));
    const next = hashAll(current);
    const contentChanged = current.some((filePath) => next[filePath] !== hashes[filePath]);
    hashes = next;
    if (added.length > 0 && watcher) {
      watcher.add(added);
    }
    if (added.length === 0 && removed.length === 0 && !contentChanged) {
      return;
    }
    context.logger.info({ spin: 'start' }, 'Server-side _js module changed - restarting server.');
    context.restartServer();
  };

  return setupWatcher({
    callback,
    context,
    watchDotfiles: true,
    watchPaths: [artifactPath, ...Object.keys(hashes)],
  }).then((created) => {
    watcher = created;
    return created;
  });
}

export default jsModuleWatcher;
