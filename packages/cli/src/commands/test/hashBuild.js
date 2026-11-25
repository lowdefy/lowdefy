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
import { stableStringify, type } from '@lowdefy/helpers';

import APP_WIDE_ARTIFACTS from '../journeys/scope/appWideArtifacts.js';
import normaliseArtifact from '../journeys/scope/normaliseArtifact.js';
import resolveBuildDirectory from '../journeys/resolveBuildDirectory.js';

// The folders of the artifacts hashed one by one: pages and their requests, endpoints,
// connections and websockets. An id may hold '/', so an artifact can sit any number of folders
// deep.
const ARTIFACT_FOLDERS = ['pages', 'api', 'connections', 'websockets'];

// Bumped whenever an artifact's hash changes meaning (what normaliseArtifact keeps, or how it is
// hashed), so a cache written by another version is never read.
const CACHE_VERSION = 1;

// An artifact modified this recently when it is hashed is hashed but not cached. A file system
// that keeps modified times to the second (HFS+, exFAT, some network and container mounts) gives a
// rewrite in that same second the same time, and one of the same size would then hit the cache
// with the old content's hash. Git treats its index the same way ("racy git").
const SETTLE_MS = 2000;

function sha1(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function listJson({ buildDirectory, folder, files }) {
  fs.readdirSync(path.join(buildDirectory, folder), { withFileTypes: true }).forEach((entry) => {
    const file = path.posix.join(folder, entry.name);
    if (entry.isDirectory()) {
      listJson({ buildDirectory, folder: file, files });
      return;
    }
    if (entry.isFile() && file.endsWith('.json')) {
      files.push(file);
    }
  });
}

// The build's hashed artifacts, by path inside the build directory, sorted.
function listArtifacts({ buildDirectory }) {
  const files = APP_WIDE_ARTIFACTS.filter((file) => fs.existsSync(path.join(buildDirectory, file)));
  ARTIFACT_FOLDERS.forEach((folder) => {
    if (fs.existsSync(path.join(buildDirectory, folder))) {
      listJson({ buildDirectory, folder, files });
    }
  });
  return files.sort();
}

function readCache({ cachePath, buildDirectory }) {
  if (type.isNone(cachePath)) {
    return {};
  }
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (cache.version === CACHE_VERSION && cache.buildDirectory === buildDirectory) {
      return cache.artifacts ?? {};
    }
  } catch {
    // No cache yet, or one cut short: every artifact is read.
  }
  return {};
}

// Written to a temporary name and renamed over the old one, so a run reading it never reads it
// half written. Two runs writing at once each write a whole, correct cache. A cache that cannot
// be written costs the next run its reads, nothing more.
function writeCache({ cachePath, buildDirectory, artifacts }) {
  if (type.isNone(cachePath)) {
    return;
  }
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    const temporary = `${cachePath}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    fs.writeFileSync(
      temporary,
      JSON.stringify({ version: CACHE_VERSION, buildDirectory, artifacts })
    );
    fs.renameSync(temporary, cachePath);
  } catch {
    // Left to the next run.
  }
}

// Identifies the config a dev server serves by its content: the pages, requests, endpoints,
// connections, websockets and app-wide artifacts of the build, without the markers that only
// locate config (so moving config between files changes nothing) and without the buildId, which
// is a fresh timestamp on every server start. Two servers started on the same config report the
// same hash. Null when the build cannot be read, which no record ever matches.
//
// Each artifact's own hash is kept in .lowdefy/test/build-hashes.json by its path, size and
// modified time, so an artifact the build has not written since is never read again (one written
// in the last 2 seconds is read each time, SETTLE_MS): a run's
// end hash reads only the pages the run built on demand, and the next run's start hash reads
// only what the server rebuilt in between. The build's other files, keyMap.json and refMap.json
// among them, are never read.
function hashBuild({ context }) {
  try {
    const buildDirectory = resolveBuildDirectory({ context });
    if (!buildDirectory) {
      return null;
    }
    const cachePath = type.isNone(context.directories.test)
      ? null
      : path.join(context.directories.test, 'build-hashes.json');
    const cached = readCache({ cachePath, buildDirectory });
    const files = listArtifacts({ buildDirectory });
    const artifacts = {};
    let changed = files.length !== Object.keys(cached).length;
    const lines = files.map((file) => {
      const filePath = path.join(buildDirectory, file);
      const { size, mtimeMs } = fs.statSync(filePath);
      const entry = cached[file];
      if (entry?.size === size && entry?.mtimeMs === mtimeMs) {
        artifacts[file] = entry;
        return `${file}\t${entry.hash}`;
      }
      const artifact = normaliseArtifact(JSON.parse(fs.readFileSync(filePath, 'utf8')));
      const hash = sha1(stableStringify(artifact));
      if (Date.now() - mtimeMs >= SETTLE_MS) {
        artifacts[file] = { size, mtimeMs, hash };
      }
      changed = true;
      return `${file}\t${hash}`;
    });
    if (changed) {
      writeCache({ cachePath, buildDirectory, artifacts });
    }
    return sha1(lines.join('\n'));
  } catch {
    return null;
  }
}

export default hashBuild;
