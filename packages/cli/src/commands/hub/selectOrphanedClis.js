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

import { type } from '@lowdefy/helpers';

import findWrapperChain from './findWrapperChain.js';

const LOWDEFY_CLI =
  /(^|\s|\/)(lowdefy|\S*lowdefy\S*\/dist\/index\.js|\S*packages\/cli\/dist\/index\.js) (start|dev|test)(\s|$)/;

// Registered servers whose owner, the CLI that started them, is alive but itself orphaned:
// its spawner (a pnpm or npx wrapper, a harness) was killed outright, its process group has
// no leader left, and nothing but wrappers is left between the CLI and the reaper. The CLI
// holds the server's stdin, so the server never notices. Same wrapper rules as for
// unregistered servers, applied to the CLI, so only a person-run prune uses it. Pure, so it
// is tested against process table fixtures.
function selectOrphanedClis({ processes, records, hubPids, platform }) {
  if (platform !== 'darwin' && platform !== 'linux') {
    return [];
  }
  const byPid = new Map(processes.map((entry) => [entry.pid, entry]));
  const orphans = [];
  records.forEach((record) => {
    if (record.owner.via !== 'cli' || !record.ownerAlive) {
      return;
    }
    const cli = byPid.get(record.owner.pid);
    if (cli === undefined || !LOWDEFY_CLI.test(cli.command)) {
      return;
    }
    // A pid whose start time differs is another process, not this server's CLI.
    if (
      !type.isNone(record.owner.processStartTime) &&
      cli.processStartTime !== record.owner.processStartTime
    ) {
      return;
    }
    if (hubPids.has(cli.pid)) {
      return;
    }
    // A killed spawner (a pnpm exec wrapper, a harness) leaves the CLI's process group without
    // its leader. A launchd or systemd service, or a hub server, keeps a live leader: the
    // service's or the hub's spawn starts a new group.
    if (byPid.has(cli.pgid)) {
      return;
    }
    const wrappers = findWrapperChain({ pid: cli.ppid, byPid, hubPids, platform });
    if (wrappers === null) {
      return;
    }
    orphans.push({
      record,
      cliPid: cli.pid,
      wrappers: wrappers.chain,
      reaper: wrappers.reaper,
    });
  });
  return orphans;
}

export default selectOrphanedClis;
