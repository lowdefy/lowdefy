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

import { readServerRegistry } from '@lowdefy/node-utils';

import findLegacyOrphans from './findLegacyOrphans.js';
import findOrphanedClis from './findOrphanedClis.js';
import getHubPaths from './getHubPaths.js';
import readHubManagedPids from './readHubManagedPids.js';
import getServerRegistryDirectory from '../../utils/getServerRegistryDirectory.js';

function write(line) {
  process.stdout.write(`${line}\n`);
}

function formatAge(startedAt) {
  const minutes = Math.round((Date.now() - new Date(startedAt).getTime()) / 60000);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  if (minutes < 60 * 48) {
    return `${Math.round(minutes / 60)}h`;
  }
  return `${Math.round(minutes / 1440)}d`;
}

function describeOwner({ record, orphaned }) {
  if (!record.ownerAlive) {
    return `${record.owner.pid} gone`;
  }
  return `${record.owner.pid} ${orphaned ? 'orphaned' : 'alive'}`;
}

function formatRecord({ record, orphaned }) {
  return [
    String(record.pid).padEnd(7),
    record.kind.padEnd(6),
    String(record.port ?? '-').padEnd(6),
    describeOwner({ record, orphaned }).padEnd(14),
    (record.prunable || orphaned ? 'yes' : 'no').padEnd(9),
    formatAge(record.startedAt).padEnd(5),
    record.configDirectory ?? record.cwd,
  ].join(' ');
}

// `lowdefy hub ps` - every Lowdefy server on this machine the registry knows, with its
// owner (an owner shown as orphaned is a CLI whose spawner was killed), and unregistered
// servers left behind by older Lowdefy versions.
async function hubPs() {
  const registered = await readServerRegistry({ directory: getServerRegistryDirectory() });
  const hubPids = readHubManagedPids({ registryPath: getHubPaths().registryPath });
  const orphanedPids = new Set(
    findOrphanedClis({ records: registered, hubPids }).map(({ record }) => record.pid)
  );
  if (registered.length === 0) {
    write('No registered Lowdefy servers are running.');
  } else {
    write(
      [
        'PID'.padEnd(7),
        'KIND'.padEnd(6),
        'PORT'.padEnd(6),
        'OWNER'.padEnd(14),
        'PRUNABLE'.padEnd(9),
        'AGE'.padEnd(5),
        'APP',
      ].join(' ')
    );
    registered.forEach((record) =>
      write(formatRecord({ record, orphaned: orphanedPids.has(record.pid) }))
    );
  }
  const legacy = findLegacyOrphans({
    registeredPids: new Set(registered.map((record) => record.pid)),
    hubPids,
  });
  if (legacy.length > 0) {
    write('');
    write('Unregistered servers with no owner left (started by an older Lowdefy):');
    legacy.forEach((orphan) =>
      write(`${String(orphan.pid).padEnd(7)} ${orphan.kind.padEnd(6)} ${orphan.cwd}`)
    );
  }
  if (registered.some((record) => record.prunable) || orphanedPids.size > 0 || legacy.length > 0) {
    write('');
    write('Run `lowdefy hub prune` to see what it would stop.');
  }
}

export default hubPs;
