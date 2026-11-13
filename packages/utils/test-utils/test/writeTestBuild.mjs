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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// @lowdefy/server in this workspace: its node_modules links to the workspace's built packages
// (@lowdefy/api, helpers, errors), which is what a built server's install holds.
const workspaceServerDirectory = path.resolve(import.meta.dirname, '../../../servers/server');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// A config directory and a built server written by hand, for the unit tests: no app is built and
// nothing is installed. It holds only what openTestApp and the access table read.
//
// - authJson: the built auth.json. No auth configured by default.
// - dataSets: the tests/data files by name, each written as JSON, which is YAML.
// - endpoints: the build/api artifacts. An endpointId with a slash is a module's endpoint, in
//   the module's folder.
// - lowdefyVersion: appMeta.lowdefyVersion, "local" by default, as a build on this checkout.
// - routes: the built routes.json.
//
// The build's refMap.json lists pages/home.yaml, so the stale check has the root lowdefy.yaml
// and one ref'd file to compare. The config is written first, so the build is the newer.
// Returns the two directories and remove(), which deletes both.
function writeTestBuild({
  authJson = { configured: false },
  dataSets = {},
  endpoints = [],
  lowdefyVersion = 'local',
  routes = [],
} = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-utils-build-'));
  const configDirectory = path.join(directory, 'config');
  const serverDirectory = path.join(directory, 'server');
  const buildDirectory = path.join(serverDirectory, 'build');

  writeFile(path.join(configDirectory, 'lowdefy.yaml'), 'lowdefy: local\nname: test-build\n');
  writeFile(path.join(configDirectory, 'pages', 'home.yaml'), 'id: home\ntype: Box\n');
  Object.entries(dataSets).forEach(([name, dataSet]) => {
    writeFile(
      path.join(configDirectory, 'tests', 'data', `${name}.yaml`),
      JSON.stringify(dataSet, null, 2)
    );
  });

  writeFile(
    path.join(serverDirectory, 'package.json'),
    JSON.stringify({ name: '@lowdefy/server', type: 'module' })
  );
  fs.symlinkSync(
    path.join(workspaceServerDirectory, 'node_modules'),
    path.join(serverDirectory, 'node_modules'),
    'dir'
  );
  writeFile(
    path.join(buildDirectory, 'appMeta.json'),
    JSON.stringify({ name: 'test-build', lowdefyVersion })
  );
  writeFile(path.join(buildDirectory, 'auth.json'), JSON.stringify(authJson));
  writeFile(path.join(buildDirectory, 'routes.json'), JSON.stringify(routes));
  endpoints.forEach((endpoint) => {
    writeFile(
      path.join(buildDirectory, 'api', `${endpoint.endpointId}.json`),
      JSON.stringify(endpoint)
    );
  });
  writeFile(
    path.join(buildDirectory, 'refMap.json'),
    JSON.stringify({
      1: { parent: null },
      2: { parent: '1', lineNumber: 4, path: 'pages/home.yaml' },
    })
  );

  return {
    configDirectory,
    serverDirectory,
    remove: () => fs.rmSync(directory, { recursive: true, force: true }),
  };
}

export default writeTestBuild;
