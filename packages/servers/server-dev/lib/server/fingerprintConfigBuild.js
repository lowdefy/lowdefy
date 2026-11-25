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

// Build directory files a config publish can change while the pages built
// before it stay current. Every other file counts as a page build input, so a
// file added to the build later is one until it is listed here.
//
// Written by the dev server's page builds (and plugins/operators/, below), or
// by the manager to signal it.
const notConfigBuildOutputs = new Set([
  '.restart',
  'buildStatus.json',
  'invalidatePages',
  'reload',
  'tailwind-candidates.css',
]);
const notConfigBuildDirectories = ['jitMaps/', 'pages/'];
// Not read by a page build, or checked page by page (pageRegistry.json:
// a page whose entry changed is rebuilt), or read through another file
// (api/: a page build reads endpoints.json). The key and ref maps locate
// errors, idCounter.json names the key prefix, and the JS maps hold content
// hashes, so the dev server merges the new skeleton entries into them.
// iconImports.json is read once per server process: icons it adds later are
// in no client bundle until a restart (bundledIcons). plugins/ holds the
// client bundle's and the server's plugin imports, which page builds do not
// read: they take types from customTypesMap.json and the installed packages.
const notPageBuildInputs = new Set([
  'app.json',
  'events.json',
  'iconImports.json',
  'idCounter.json',
  'jsMap.json',
  'keyMap.json',
  'linkEndpoints.json',
  'logger.json',
  'mcp.json',
  'menus.json',
  'pageRegistry.json',
  'refMap.json',
  'schedules.json',
  'security.json',
  'skeletonSourceFiles.json',
  'types.json',
]);
const notPageBuildInputDirectories = ['api/', 'connections/', 'plugins/'];

// Fields a config build sets anew each run whatever the config: appMeta's
// buildId is a random id. A page build that reads appMeta is rebuilt after
// every config publish (pageBuildRecords.trackAppMetaReads), so its fingerprint
// leaves the id out.
const perBuildFields = { 'appMeta.json': ['buildId'] };

function isPageBuildInput(name) {
  if (notConfigBuildOutputs.has(name) || notPageBuildInputs.has(name)) {
    return false;
  }
  return ![...notConfigBuildDirectories, ...notPageBuildInputDirectories].some((directory) =>
    name.startsWith(directory)
  );
}

function listFiles(buildDirectory) {
  return fs
    .readdirSync(buildDirectory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path
        .relative(buildDirectory, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join('/')
    );
}

// A file is written whole and renamed into place, or left as it was when its
// bytes are unchanged (publishBuildDirectory), so a file with the same inode,
// size and times has the content it had.
function readIdentity(filePath) {
  const stat = fs.statSync(filePath, { bigint: true });
  return `${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`;
}

// The config build keys every node it writes, and names the root ref, with
// ids that start with its own prefix (makeId), so two builds of the same
// config differ only in their prefixes (and modules.json writes its var
// caches in key order, see writeModules). Without the prefixes and the
// per-build fields, the text is the content: a change of key order is a
// change, since it can change what a page shows (_object.keys, style).
function fingerprint({ name, filePath, prefix }) {
  let text = fs.readFileSync(filePath, 'utf8');
  const fields = perBuildFields[name];
  if (fields) {
    const value = JSON.parse(text);
    for (const field of fields) {
      delete value[field];
    }
    text = JSON.stringify(value);
  }
  return crypto.createHash('sha1').update(text.replaceAll(prefix, '')).digest('hex');
}

// What the page builds of a config build depend on, read from its build
// directory: each page build input's fingerprint, by file. A file unchanged
// since previous (an earlier result) is not read again.
function fingerprintConfigBuild({ buildDirectory, previous }) {
  const { prefix } = JSON.parse(
    fs.readFileSync(path.join(buildDirectory, 'idCounter.json'), 'utf8')
  );
  const files = new Map();
  for (const name of listFiles(buildDirectory).filter(isPageBuildInput).sort()) {
    const filePath = path.join(buildDirectory, name);
    let identity;
    try {
      identity = readIdentity(filePath);
    } catch (error) {
      // Removed since the listing: the next publish's fingerprint has it or not.
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const kept = previous?.files.get(name);
    let value;
    try {
      value =
        kept?.identity === identity ? kept.fingerprint : fingerprint({ name, filePath, prefix });
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    files.set(name, { identity, fingerprint: value });
  }
  return { buildDirectory, prefix, files };
}

// Whether two config builds give every page build the same inputs.
function sameFingerprint(a, b) {
  if (a.buildDirectory !== b.buildDirectory || a.files.size !== b.files.size) return false;
  for (const [name, { fingerprint: value }] of a.files) {
    if (b.files.get(name)?.fingerprint !== value) return false;
  }
  return true;
}

export { sameFingerprint };
export default fingerprintConfigBuild;
