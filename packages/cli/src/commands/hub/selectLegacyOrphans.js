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

// A Lowdefy server process, as `lowdefy start|dev` and the monorepo scripts run it.
const SERVER_COMMANDS = [
  { kind: 'server', pattern: /^(\S*\/)?node(\.exe)? src\/index\.js$/ },
  { kind: 'dev', pattern: /^(\S*\/)?node(\.exe)? manager\/run\.mjs$/ },
];

// The only processes allowed between a leaked server and the reaper. Any other ancestor -
// a shell, a terminal, an IDE, the hub - means someone may still want the server.
const WRAPPERS = [
  // pnpm, its standalone build (@pnpm/exe) and pnpm.cjs run by node
  /(^|\/)pnpm(\.c?js)?(\s|$)/,
  /@pnpm\/exe\//,
  /(^|\/)npm(-cli\.js)? exec(\s|$)/,
  /(^|\/)npx(-cli\.js)?(\s|$)/,
  /^(\S*\/)?sh -c(\s|$)/,
  /(^|\/)infisical run(\s|$)/,
  // The lowdefy CLI: its bin, an installed dist entry, or the monorepo's packages/cli
  /(^|\s|\/)(lowdefy|\S*lowdefy\S*\/dist\/index\.js|\S*packages\/cli\/dist\/index\.js) (start|dev|test)(\s|$)/,
];

const SYSTEMD_USER = /(^|\/)systemd --user(\s|$)/;

function serverKind(command) {
  const match = SERVER_COMMANDS.find(({ pattern }) => pattern.test(command));
  return match?.kind ?? null;
}

function hasLowdefyServerCwd(cwd) {
  return /\/\.lowdefy\/(server|dev)$/.test(cwd) || cwd.includes('/_server/');
}

function isWrapper(command) {
  return WRAPPERS.some((pattern) => pattern.test(command));
}

// Walks up from the server's parent. Returns the chain of wrapper commands when every
// ancestor is a known wrapper up to the reaper (PID 1, or systemd --user on Linux), else null.
function findWrapperChain({ server, byPid, hubPids, platform }) {
  const chain = [];
  let pid = server.ppid;
  const seen = new Set();
  while (!seen.has(pid)) {
    seen.add(pid);
    if (pid === 1) {
      return { chain, reaper: 'pid 1' };
    }
    if (hubPids.has(pid)) {
      return null;
    }
    const ancestor = byPid.get(pid);
    if (ancestor === undefined) {
      return null;
    }
    if (platform === 'linux' && SYSTEMD_USER.test(ancestor.command)) {
      return { chain, reaper: 'systemd --user' };
    }
    if (!isWrapper(ancestor.command)) {
      return null;
    }
    chain.push(ancestor.command);
    pid = ancestor.ppid;
  }
  return null;
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
    const wrappers = findWrapperChain({ server, byPid, hubPids, platform });
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
