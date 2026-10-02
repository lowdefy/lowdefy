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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';

// pid -> start time of the processes "running" in each test.
let running;
let records;
const mockFindLegacyOrphans = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  isPidAlive: (pid) => running.has(pid),
  isProcessAlive: ({ pid, processStartTime }) =>
    running.has(pid) && (processStartTime == null || running.get(pid) === processStartTime),
  readServerRegistry: () => records,
}));
jest.unstable_mockModule('./findLegacyOrphans.js', () => ({ default: mockFindLegacyOrphans }));
const mockFindOrphanedClis = jest.fn();
jest.unstable_mockModule('./findOrphanedClis.js', () => ({ default: mockFindOrphanedClis }));

const { default: pruneServers } = await import('./pruneServers.js');

const realKill = process.kill;
let signals;
let directory;

function record({ pid, prunable, recordPath }) {
  return {
    pid,
    processStartTime: `start-${pid}`,
    kind: 'server',
    port: 3112,
    configDirectory: '/apps/one',
    cwd: '/apps/one/.lowdefy/server',
    owner: { pid: 900, processStartTime: 'owner', via: 'cli' },
    ownerAlive: !prunable,
    prunable,
    recordPath,
  };
}

function writeRecordFile(pid) {
  const recordPath = path.join(directory, `${pid}.json`);
  fs.writeFileSync(recordPath, JSON.stringify({ pid }));
  return recordPath;
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-prune-'));
  running = new Map();
  records = [];
  signals = [];
  mockFindLegacyOrphans.mockReset();
  mockFindLegacyOrphans.mockReturnValue([]);
  mockFindOrphanedClis.mockReset();
  mockFindOrphanedClis.mockReturnValue([]);
  // Processes honour SIGTERM unless marked stubborn; SIGKILL always works.
  process.kill = jest.fn((pid, signal) => {
    signals.push({ pid, signal });
    if (!running.has(pid)) {
      const error = new Error('ESRCH');
      error.code = 'ESRCH';
      throw error;
    }
    if (signal === 'SIGKILL' || !String(running.get(pid)).startsWith('stubborn')) {
      running.delete(pid);
    }
  });
});

afterEach(() => {
  process.kill = realKill;
  fs.rmSync(directory, { recursive: true, force: true });
});

test('pruneServers lists a registered server whose owner is gone, and signals nothing without kill', async () => {
  running.set(100, 'start-100');
  records = [record({ pid: 100, prunable: true }), record({ pid: 101, prunable: false })];
  running.set(101, 'start-101');
  const candidates = await pruneServers({ directory });
  expect(candidates).toMatchObject([
    { source: 'registry', pid: 100, kind: 'server', reason: 'CLI pid 900 is gone' },
  ]);
  expect(signals).toEqual([]);
  expect(mockFindLegacyOrphans).not.toHaveBeenCalled();
  expect(mockFindOrphanedClis).not.toHaveBeenCalled();
});

test('pruneServers with kill SIGTERMs the pid of a server whose owner is gone and removes its record', async () => {
  running.set(100, 'start-100');
  running.set(101, 'start-101');
  const recordPath = writeRecordFile(100);
  records = [
    record({ pid: 100, prunable: true, recordPath }),
    record({ pid: 101, prunable: false }),
  ];
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([{ pid: 100, signal: 'SIGTERM' }]);
  expect(candidate.result).toEqual('stopped');
  expect(fs.existsSync(recordPath)).toBe(false);
  expect(running.has(101)).toBe(true);
});

test('pruneServers escalates to SIGKILL for a server that ignores SIGTERM', async () => {
  running.set(100, 'start-100');
  records = [{ ...record({ pid: 100, prunable: true }), processStartTime: 'stubborn' }];
  running.set(100, 'stubborn');
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([
    { pid: 100, signal: 'SIGTERM' },
    { pid: 100, signal: 'SIGKILL' },
  ]);
  expect(candidate.result).toEqual('killed');
});

test('pruneServers skips a server whose pid now names another process', async () => {
  running.set(100, 'someone-else');
  records = [record({ pid: 100, prunable: true })];
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([]);
  expect(candidate.result).toEqual('gone');
  expect(running.has(100)).toBe(true);
});

test('pruneServers adds unregistered legacy orphans only when asked, excluding registered pids', async () => {
  running.set(100, 'start-100');
  running.set(102, 'legacy-start');
  records = [record({ pid: 100, prunable: false })];
  mockFindLegacyOrphans.mockReturnValue([
    {
      pid: 102,
      processStartTime: 'legacy-start',
      kind: 'dev',
      cwd: '/old/app/.lowdefy/dev',
      wrappers: ['pnpm exec lowdefy dev'],
      reaper: 'pid 1',
    },
  ]);
  const hubRegistryPath = path.join(directory, 'registry.json');
  fs.writeFileSync(hubRegistryPath, JSON.stringify({ instances: { '/a': { pid: 55 } } }));
  const candidates = await pruneServers({ directory, hubRegistryPath, includeLegacy: true });
  expect(candidates).toMatchObject([
    { source: 'legacy', pid: 102, kind: 'dev', reason: 'unregistered; only wrappers up to pid 1' },
  ]);
  const { registeredPids, hubPids } = mockFindLegacyOrphans.mock.calls[0][0];
  expect([...registeredPids]).toEqual([100]);
  expect([...hubPids]).toEqual([55]);
  expect(signals).toEqual([]);
});

test('pruneServers with includeLegacy stops a registered server kept alive only by an orphaned CLI', async () => {
  running.set(100, 'start-100');
  const recordPath = writeRecordFile(100);
  const orphaned = record({ pid: 100, prunable: false, recordPath });
  records = [orphaned];
  mockFindOrphanedClis.mockReturnValue([
    { record: orphaned, cliPid: 900, wrappers: [], reaper: 'pid 1' },
  ]);
  const listed = await pruneServers({ directory, includeLegacy: true });
  expect(listed).toMatchObject([
    {
      source: 'orphaned-cli',
      pid: 100,
      reason: 'CLI pid 900 is orphaned; only wrappers up to pid 1',
    },
  ]);
  expect(signals).toEqual([]);
  expect(mockFindOrphanedClis.mock.calls[0][0].records).toEqual([orphaned]);

  const [stopped] = await pruneServers({ directory, includeLegacy: true, kill: true, graceMs: 50 });
  expect(signals).toEqual([{ pid: 100, signal: 'SIGTERM' }]);
  expect(stopped.result).toEqual('stopped');
  expect(fs.existsSync(recordPath)).toBe(false);
});
