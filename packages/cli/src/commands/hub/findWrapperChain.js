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

function isWrapper(command) {
  return WRAPPERS.some((pattern) => pattern.test(command));
}

// Walks up from pid (a process's parent). Returns the chain of wrapper commands when every
// process up to the reaper (PID 1, or systemd --user on Linux) is a known wrapper, else null.
// A hub process group leader on the way means the hub owns what is below it.
function findWrapperChain({ pid: startPid, byPid, hubPids, platform }) {
  const chain = [];
  let pid = startPid;
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

export default findWrapperChain;
