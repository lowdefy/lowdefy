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
import { wait } from '@lowdefy/helpers';
import { isPidAlive, isProcessAlive, readServerRegistry } from '@lowdefy/node-utils';

import findLegacyOrphans from './findLegacyOrphans.js';
import readHubManagedPids from './readHubManagedPids.js';

function describeOwner(owner) {
  return owner.via === 'exit-with-pid' ? `owner pid ${owner.pid}` : `CLI pid ${owner.pid}`;
}

function signalPid({ pid, signal }) {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
}

function removeRecord({ candidate }) {
  if (candidate.recordPath === undefined) {
    return;
  }
  try {
    const record = JSON.parse(fs.readFileSync(candidate.recordPath, 'utf8'));
    if (record.pid === candidate.pid) {
      fs.rmSync(candidate.recordPath, { force: true });
    }
  } catch {
    // The server removed its own record on the way out.
  }
}

async function stopCandidates({ candidates, graceMs }) {
  candidates.forEach((candidate) => {
    // The pid may have been reused since it was listed.
    if (!isProcessAlive({ pid: candidate.pid, processStartTime: candidate.processStartTime })) {
      candidate.result = 'gone';
      return;
    }
    // The pid, never its group: an orphan keeps its dead spawner's group, which can hold
    // unrelated survivors.
    candidate.result = signalPid({ pid: candidate.pid, signal: 'SIGTERM' }) ? 'stopped' : 'gone';
  });
  const signalled = candidates.filter((candidate) => candidate.result === 'stopped');
  const deadline = Date.now() + graceMs;
  while (signalled.some((candidate) => isPidAlive(candidate.pid)) && Date.now() < deadline) {
    await wait(200);
  }
  signalled.forEach((candidate) => {
    if (!isProcessAlive({ pid: candidate.pid, processStartTime: candidate.processStartTime })) {
      return;
    }
    signalPid({ pid: candidate.pid, signal: 'SIGKILL' });
    candidate.result = 'killed';
  });
  candidates.forEach((candidate) => removeRecord({ candidate }));
}

// Stops Lowdefy servers that provably have no owner. Registered servers (every server the
// CLI started since servers record themselves) are prunable only when their owner is gone:
// exact, and the only pass that runs unattended (the hub, at start). includeLegacy adds
// unregistered servers matched from the process table, for a person-run prune. Without
// kill it only lists what it would stop.
async function pruneServers({
  directory,
  hubRegistryPath,
  includeLegacy = false,
  kill = false,
  graceMs = 10000,
}) {
  const registered = readServerRegistry({ directory });
  const candidates = registered
    .filter((record) => record.prunable)
    .map((record) => ({
      source: 'registry',
      pid: record.pid,
      processStartTime: record.processStartTime,
      kind: record.kind,
      port: record.port,
      configDirectory: record.configDirectory,
      cwd: record.cwd,
      recordPath: record.recordPath,
      reason: `${describeOwner(record.owner)} is gone`,
    }));
  if (includeLegacy) {
    const legacy = findLegacyOrphans({
      registeredPids: new Set(registered.map((record) => record.pid)),
      hubPids: readHubManagedPids({ registryPath: hubRegistryPath }),
    });
    legacy.forEach((orphan) => {
      candidates.push({
        source: 'legacy',
        pid: orphan.pid,
        processStartTime: orphan.processStartTime,
        kind: orphan.kind,
        cwd: orphan.cwd,
        reason: `unregistered; only ${
          orphan.wrappers.length === 0 ? 'the reaper' : 'wrappers'
        } up to ${orphan.reaper}`,
      });
    });
  }
  if (kill) {
    await stopCandidates({ candidates, graceMs });
  }
  return candidates;
}

export default pruneServers;
