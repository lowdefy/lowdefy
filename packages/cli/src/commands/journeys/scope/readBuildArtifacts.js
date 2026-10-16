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

// The artifacts compared one by one, keyed by id, and the app-wide artifacts
// that can affect any page. Every other file the build writes is uncompared.
const APP_WIDE = [
  'events.json',
  'menus.json',
  'global.json',
  'app.json',
  'config.json',
  'i18n.json',
  'theme.json',
  'auth.json',
  'dynamicPolicies.json',
  'tenantTargets.json',
];

// Build identity, not config: a fresh buildId every build, and the commit.
const BUILD_IDENTITY = ['appMeta.json'];

function listFiles(directory, prefix = '') {
  return fs.readdirSync(path.join(directory, prefix), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? listFiles(directory, relative) : [relative];
  });
}

// The id an artifact is written for: its path inside folder, less .json.
function idOf(file, folder) {
  return file.slice(folder.length, -'.json'.length);
}

// A page's requests sit in the folder named for the page, as
// pages/<pageId>/requests/<requestId>.json, and either id may hold '/'. The
// first split whose page id is a page wins.
function splitRequest({ file, pageIds }) {
  if (!file.startsWith('pages/') || !file.endsWith('.json')) return null;
  const id = idOf(file, 'pages/');
  const marker = '/requests/';
  for (let at = id.indexOf(marker); at !== -1; at = id.indexOf(marker, at + 1)) {
    const pageId = id.slice(0, at);
    if (pageIds.has(pageId)) return { pageId, requestId: id.slice(at + marker.length) };
  }
  return null;
}

function readJson({ buildDirectory, file }) {
  return JSON.parse(fs.readFileSync(path.join(buildDirectory, file), 'utf8'));
}

// One build directory, read into the groups the scope diff compares. Values
// are the parsed artifacts with their markers, so a changed block can still
// be located through keyMap.json; comparisons normalise them first.
function readBuildArtifacts({ buildDirectory }) {
  const build = {
    directory: buildDirectory,
    pages: {},
    requests: {},
    endpoints: {},
    connections: {},
    websockets: {},
    appWide: {},
    files: {},
    keyMap: readJson({ buildDirectory, file: 'keyMap.json' }),
    refMap: readJson({ buildDirectory, file: 'refMap.json' }),
  };
  const files = listFiles(buildDirectory).filter((file) => !BUILD_IDENTITY.includes(file));
  // Ids may hold '/' (a module's pages, endpoints, connections and websockets
  // are scoped as <entryId>/<id>), so an artifact can sit any number of
  // folders deep.
  const pageIds = new Set(
    files.filter((file) => /^pages\/.+\.json$/.test(file)).map((file) => idOf(file, 'pages/'))
  );
  files.forEach((file) => {
    const request = splitRequest({ file, pageIds });
    if (request) {
      const { pageId, requestId } = request;
      build.requests[pageId] = build.requests[pageId] ?? {};
      build.requests[pageId][requestId] = readJson({ buildDirectory, file });
      return;
    }
    const [folder] = file.split('/');
    const group = {
      pages: 'pages',
      api: 'endpoints',
      connections: 'connections',
      websockets: 'websockets',
    }[folder];
    if (group && file.endsWith('.json')) {
      build[group][idOf(file, `${folder}/`)] = readJson({ buildDirectory, file });
      return;
    }
    if (APP_WIDE.includes(file)) {
      build.appWide[file] = readJson({ buildDirectory, file });
      return;
    }
    build.files[file] = fs.readFileSync(path.join(buildDirectory, file), 'utf8');
  });
  return build;
}

export default readBuildArtifacts;
