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

const path = require('path');

async function run() {
  // Doing weird things for webpack module federation.
  // Webpack needs an async import to resolve shared dependencies.
  const build = await require('./dist/index.js').default.then((module) => module.default);
  await build({
    // blocksServerUrl: 'https://blocks-cdn.lowdefy.com/v3.16.0',
    logger: console,
    buildDirectory: path.resolve(process.cwd(), '../servers/serverDev/.lowdefy/build'),
    // buildDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    // cacheDirectory: path.resolve(process.cwd(), '../servers/serverDev/.lowdefy/.cache'),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    // configDirectory: path.resolve(process.cwd(), '../docs'),
    // configDirectory: path.resolve(process.cwd(), '../servers/serverDev'),
    configDirectory: process.cwd(),
  });
}

run();
