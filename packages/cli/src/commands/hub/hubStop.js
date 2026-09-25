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

import path from 'path';

import connectHub from './connectHub.js';

function write(value) {
  process.stdout.write(`${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`);
}

async function hubStop({ directory = '.', all = false }) {
  const hub = await connectHub({ autoStart: false });
  if (hub === null) {
    write('No Lowdefy hub is running.');
    return;
  }
  const targets = all
    ? (await hub.request('list')).instances.map((instance) => instance.configDirectory)
    : [path.resolve(directory)];
  for (const configDirectory of targets) {
    write({ configDirectory, ...(await hub.request('stop', { configDirectory })) });
  }
  hub.close();
}

export default hubStop;
