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

// Builds a fixture app with the Lowdefy build: node buildFixture.mjs <config dir> <out dir>. The
// build writes to <out dir>/build. Jest tests run it in a child process, since @lowdefy/build
// does not load under the React Native Jest preset.
import fs from 'node:fs';
import path from 'node:path';

import build from '@lowdefy/build';
import { createNodeLogger } from '@lowdefy/logger/node';

const [configDirectory, outDirectory] = process.argv.slice(2);
const serverDirectory = path.join(outDirectory, 'server');
// The parts of a server folder the build writes into: its package.json (the app's plugin
// packages) and its default public files.
fs.mkdirSync(path.join(serverDirectory, 'public_default'), { recursive: true });
fs.writeFileSync(path.join(serverDirectory, 'package.json'), JSON.stringify({ dependencies: {} }));
await build({
  directories: {
    config: path.resolve(configDirectory),
    build: path.join(outDirectory, 'build'),
    server: serverDirectory,
  },
  logger: createNodeLogger({ level: 'error' }),
  stage: 'prod',
});
