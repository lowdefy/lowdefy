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

// The Vite child a dev manager spawns (server-dev manager/processes/startServer.mjs), on the
// manager's internal loopback port.
const VITE_COMMAND =
  /^(\S*\/)?node(\.exe)? \S*\/vite\/bin\/vite\.js --host 127\.0\.0\.1 --port \d+ --strictPort$/;

function serverKind(command) {
  const match = SERVER_COMMANDS.find(({ pattern }) => pattern.test(command));
  return match?.kind ?? null;
}

function hasLowdefyServerCwd(cwd) {
  return /\/\.lowdefy\/(server|dev)$/.test(cwd) || cwd.includes('/_server/');
}

function hasLowdefyDevCwd(cwd) {
  return /\/\.lowdefy\/dev$/.test(cwd) || cwd.includes('/_server/');
}

// A dev manager's Vite child left running after its manager died: managers from before
// the child exited with its manager left it holding the internal port. Its parent must be
// the reaper itself, since a live manager is always its child's parent, and it must not be
// in a process group the hub started (the hub stops those itself).
function selectOrphanedVite({ vite, byPid, cwds, hubPids, platform }) {
  if (!VITE_COMMAND.test(vite.command) || hubPids.has(vite.pgid)) {
    return null;
  }
  const cwd = cwds.get(vite.pid);
  if (cwd === undefined || !hasLowdefyDevCwd(cwd)) {
    return null;
  }
  const wrappers = findWrapperChain({ pid: vite.ppid, byPid, hubPids, platform });
  if (wrappers === null || wrappers.chain.length !== 0) {
    return null;
  }
  return {
    pid: vite.pid,
    processStartTime: vite.processStartTime,
    kind: 'vite',
    cwd,
    wrappers: [],
    reaper: wrappers.reaper,
  };
}

// Unregistered Lowdefy servers that provably have no owner left: started before servers
// recorded themselves, by something that died, with only wrappers between the server and
// the reaper; and dev managers' Vite children whose manager is gone. Pure, so the rules
// are tested against process table fixtures.
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
      const vite = selectOrphanedVite({ vite: server, byPid, cwds, hubPids, platform });
      if (vite !== null) {
        orphans.push(vite);
      }
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
