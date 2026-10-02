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

import findWrapperChain from './findWrapperChain.js';

// A Lowdefy server process, as `lowdefy start|dev` and the monorepo scripts run it.
const SERVER_COMMANDS = [
  { kind: 'server', pattern: /^(\S*\/)?node(\.exe)? src\/index\.js$/ },
  { kind: 'dev', pattern: /^(\S*\/)?node(\.exe)? manager\/run\.mjs$/ },
];

function serverKind(command) {
  const match = SERVER_COMMANDS.find(({ pattern }) => pattern.test(command));
  return match?.kind ?? null;
}

function hasLowdefyServerCwd(cwd) {
  return /\/\.lowdefy\/(server|dev)$/.test(cwd) || cwd.includes('/_server/');
}

// Unregistered Lowdefy servers that provably have no owner left: started before servers
// recorded themselves, by something that died, with only wrappers between the server and
// the reaper. Pure, so the rules are tested against process table fixtures.
function selectLegacyOrphans({ processes, cwds, registeredPids, hubPids, platform }) {
  if (platform !== 'darwin' && platform !== 'linux') {
    return [];
  }
  const byPid = new Map(processes.map((entry) => [entry.pid, entry]));
  const orphans = [];
  processes.forEach((server) => {
    if (registeredPids.has(server.pid) || hubPids.has(server.pid)) {
      return;
    }
    const kind = serverKind(server.command);
    if (kind === null) {
      return;
    }
    const cwd = cwds.get(server.pid);
    if (cwd === undefined || !hasLowdefyServerCwd(cwd)) {
      return;
    }
    const wrappers = findWrapperChain({ pid: server.ppid, byPid, hubPids, platform });
    if (wrappers === null) {
      return;
    }
    orphans.push({
      pid: server.pid,
      processStartTime: server.processStartTime,
      kind,
      cwd,
      wrappers: wrappers.chain,
      reaper: wrappers.reaper,
    });
  });
  return orphans;
}

export default selectLegacyOrphans;
