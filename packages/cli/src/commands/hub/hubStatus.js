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

import connectHub from './connectHub.js';
import getHubPaths from './getHubPaths.js';

function write(value) {
  process.stdout.write(`${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}\n`);
}

function formatRow(instance) {
  const where = instance.url ?? '-';
  return `${instance.state.padEnd(9)} ${(instance.owner ?? '-').padEnd(8)} ${where.padEnd(24)} ${
    instance.configDirectory
  }`;
}

async function hubStatus() {
  const hub = await connectHub({ autoStart: false });
  if (hub === null) {
    write(`No Lowdefy hub is running (${getHubPaths().socketPath}).`);
    return;
  }
  const { instances } = await hub.request('list');
  hub.close();
  if (instances.length === 0) {
    write('The Lowdefy hub is running no dev servers.');
    return;
  }
  write(`${'STATE'.padEnd(9)} ${'OWNER'.padEnd(8)} ${'URL'.padEnd(24)} APP`);
  instances.forEach((instance) => write(formatRow(instance)));
}

export default hubStatus;
