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

import getHubPaths from './getHubPaths.js';
import pruneServers from './pruneServers.js';
import getServerRegistryDirectory from '../../utils/getServerRegistryDirectory.js';

function write(line) {
  process.stdout.write(`${line}\n`);
}

const RESULTS = {
  gone: 'already gone, not signalled',
  killed: 'killed',
  stopped: 'stopped',
};

// `lowdefy hub prune [--kill]` - stops Lowdefy servers that provably have no owner. A dry
// run unless --kill is passed, so a person sees the list before anything is signalled.
async function hubPrune({ kill = false }) {
  const candidates = await pruneServers({
    directory: getServerRegistryDirectory(),
    hubRegistryPath: getHubPaths().registryPath,
    includeLegacy: true,
    kill,
  });
  if (candidates.length === 0) {
    write('No Lowdefy servers to prune: every server has a live owner.');
    return;
  }
  write(kill ? 'Pruned:' : 'Would stop:');
  candidates.forEach((candidate) => {
    const where = candidate.configDirectory ?? candidate.cwd;
    const result = kill ? ` - ${RESULTS[candidate.result]}` : '';
    write(
      `  ${String(candidate.pid).padEnd(7)} ${candidate.kind.padEnd(6)} ${where} (${
        candidate.reason
      })${result}`
    );
  });
  if (!kill) {
    write('');
    write('Run `lowdefy hub prune --kill` to stop them.');
  }
}

export default hubPrune;
