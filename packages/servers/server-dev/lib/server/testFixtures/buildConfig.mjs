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
import path from 'node:path';
import { buildEndpointsJit, findEndpointsReadingFiles, shallowBuild } from '@lowdefy/build/dev';

import publishBuildDirectory from '../../../manager/utils/publishBuildDirectory.mjs';

// What the dev manager does after an edit, for a test, in a Node process of
// its own: the build imports plugin modules dynamically, so it runs outside the
// test runner's module runtime.
//   node buildConfig.mjs <configDirectory> <serverDirectory>
//     a config build, published over <serverDirectory>/build
//   node buildConfig.mjs <configDirectory> <serverDirectory> <file> <from> <to>
//     replaces <from> with <to> in <file> (relative to the config directory)
//     after a config build of the config as it was, then rebuilds the
//     endpoints that file feeds alone into the live build, as the manager does
//     for an edit that only endpoints read
const [configDirectory, serverDirectory, file, from, to] = process.argv.slice(2);
const directories = {
  config: configDirectory,
  build: path.join(serverDirectory, 'build'),
  buildStaging: path.join(serverDirectory, 'build-staging'),
  server: serverDirectory,
};
// A config build reads the server's package.json and default public folder.
const serverDevDirectory = path.resolve(import.meta.dirname, '../../..');
fs.mkdirSync(path.join(serverDirectory, 'public_default'), { recursive: true });
fs.copyFileSync(
  path.join(serverDevDirectory, 'package.json'),
  path.join(serverDirectory, 'package.json')
);
function quiet() {}
const result = await shallowBuild({
  customMessagesMap: {},
  customTypesMap: {},
  directories: { ...directories, build: directories.buildStaging },
  logger: { debug: quiet, info: quiet, warn: quiet, error: console.error, ui: {} },
  stage: 'dev',
});
if (!file) {
  await publishBuildDirectory({
    buildDirectory: directories.build,
    stagingDirectory: directories.buildStaging,
  });
  process.exit(0);
}
fs.rmSync(directories.buildStaging, { recursive: true, force: true });
const filePath = path.join(configDirectory, file);
fs.writeFileSync(filePath, fs.readFileSync(filePath, 'utf8').replace(from, to));
const endpointIds = findEndpointsReadingFiles({
  endpointRegistry: result.endpointRegistry,
  files: [file],
});
if (endpointIds === null) {
  throw new Error(`${file} is read by more than endpoints.`);
}
const endpointBuild = await buildEndpointsJit({
  endpointIds,
  endpointRegistry: result.endpointRegistry,
  context: result.context,
  directories: { build: directories.build },
});
if (endpointBuild.fallback) {
  throw new Error(`The endpoint build fell back: ${endpointBuild.fallback}`);
}
