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
import { shallowBuild } from '@lowdefy/build/dev';

// Builds an app into <serverDirectory>/build for a test, in a Node process of its own: the build
// imports plugin modules dynamically, which jest's module runtime cannot load.
//   node buildTestApp.mjs <configDirectory> <serverDirectory>
const [configDirectory, serverDirectory] = process.argv.slice(2);
const serverDevDirectory = path.resolve(import.meta.dirname, '../../../..');
const directories = {
  config: configDirectory,
  build: path.join(serverDirectory, 'build'),
  server: path.join(serverDirectory, 'server'),
};
fs.mkdirSync(path.join(directories.server, 'public_default'), { recursive: true });
fs.copyFileSync(
  path.join(serverDevDirectory, 'package.json'),
  path.join(directories.server, 'package.json')
);
const quiet = () => {};
await shallowBuild({
  customMessagesMap: {},
  customTypesMap: {},
  directories,
  logger: { debug: quiet, info: quiet, warn: quiet, error: console.error, ui: {} },
  stage: 'dev',
});
