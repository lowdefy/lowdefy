/*
  Copyright 2020-2021 Lowdefy, Inc

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

import path from 'path';
import build from './dist/index.js';

async function run() {
  await build({
    // blocksServerUrl: 'https://blocks-cdn.lowdefy.com/v3.16.0',
    logger: console,
    buildDirectory: path.resolve(process.cwd(), '../server/.lowdefy/build'),
    // buildDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    // cacheDirectory: path.resolve(process.cwd(), '../servers/serverDev/.lowdefy/.cache'),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    // configDirectory: path.resolve(process.cwd(), '../docs'),
    // configDirectory: path.resolve(process.cwd(), '../servers/serverDev'),
    configDirectory: process.cwd(),
  });
}

run();
