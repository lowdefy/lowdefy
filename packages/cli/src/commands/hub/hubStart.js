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

import checkDependenciesInstalled from '../mcp/checkDependenciesInstalled.js';
import findGitRoot from '../mcp/findGitRoot.js';
import connectHub from './connectHub.js';

function write(value) {
  process.stdout.write(`${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`);
}

async function hubStart({ directory = '.', restart = false, clean = false }) {
  const configDirectory = path.resolve(directory);
  if (!fs.existsSync(configDirectory)) {
    throw new Error(`Directory ${configDirectory} does not exist.`);
  }
  // The hub does not check installs (it may be an older version than this
  // CLI), so the terminal command checks before it asks.
  const realDirectory = fs.realpathSync.native(configDirectory);
  checkDependenciesInstalled({
    configDirectory: realDirectory,
    root: findGitRoot({ directory: realDirectory }),
  });
  const hub = await connectHub();
  const result = await hub.request('start', {
    configDirectory,
    env: process.env,
    restart,
    clean,
  });
  hub.close();
  write(result);
}

export default hubStart;
