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

const { default: compareProcessStartTimes } = await import(
  '@lowdefy/node-utils/compareProcessStartTimes.js'
);
const { default: isProcessStartTime } = await import('@lowdefy/node-utils/isProcessStartTime.js');

// pid -> start time (epoch milliseconds) of the processes "running" in each test.
let running;
let records;
const mockFindLegacyOrphans = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  compareProcessStartTimes,
  isPidAlive: (pid) => running.has(pid),
  isProcessStartTime,
  readProcessStartTime: async ({ pid }) => running.get(pid) ?? null,
  readServerRegistry: async () => records,
}));
jest.unstable_mockModule('./findLegacyOrphans.js', () => ({ default: mockFindLegacyOrphans }));
const mockFindOrphanedClis = jest.fn();
jest.unstable_mockModule('./findOrphanedClis.js', () => ({ default: mockFindOrphanedClis }));

const { default: pruneServers } = await import('./pruneServers.js');

function start(pid) {
  return 1790000000000 + pid;
}
const STUBBORN = 1790000005555;
const SOMEONE_ELSE = 1790000007777;

const realKill = process.kill;
let signals;
let directory;

function record({ pid, prunable, recordPath }) {
  return {
    pid,
    processStartTime: start(pid),
    kind: 'server',
    port: 3112,
    configDirectory: '/apps/one',
    cwd: '/apps/one/.lowdefy/server',
    owner: { pid: 900, processStartTime: start(900), via: 'cli' },
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
    if (signal === 'SIGKILL' || running.get(pid) !== STUBBORN) {
      running.delete(pid);
    }
  });
});

afterEach(() => {
  process.kill = realKill;
  fs.rmSync(directory, { recursive: true, force: true });
});

test('pruneServers lists a registered server whose owner is gone, and signals nothing without kill', async () => {
  running.set(100, start(100));
  records = [record({ pid: 100, prunable: true }), record({ pid: 101, prunable: false })];
  running.set(101, start(101));
  const candidates = await pruneServers({ directory });
  expect(candidates).toMatchObject([
    { source: 'registry', pid: 100, kind: 'server', reason: 'CLI pid 900 is gone' },
  ]);
  expect(signals).toEqual([]);
  expect(mockFindLegacyOrphans).not.toHaveBeenCalled();
  expect(mockFindOrphanedClis).not.toHaveBeenCalled();
});

test('pruneServers with kill SIGTERMs the pid of a server whose owner is gone and removes its record', async () => {
  running.set(100, start(100));
  running.set(101, start(101));
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
  running.set(100, start(100));
  records = [{ ...record({ pid: 100, prunable: true }), processStartTime: STUBBORN }];
  running.set(100, STUBBORN);
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([
    { pid: 100, signal: 'SIGTERM' },
    { pid: 100, signal: 'SIGKILL' },
  ]);
  expect(candidate.result).toEqual('killed');
});

test('pruneServers skips a server whose pid now names another process', async () => {
  running.set(100, SOMEONE_ELSE);
  records = [record({ pid: 100, prunable: true })];
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([]);
  expect(candidate.result).toEqual('gone');
  expect(running.has(100)).toBe(true);
});

test('pruneServers never signals or unregisters a candidate whose start time cannot be read', async () => {
  running.set(100, null);
  running.set(101, start(101));
  const recordPath100 = writeRecordFile(100);
  const recordPath101 = writeRecordFile(101);
  records = [
    { ...record({ pid: 100, prunable: true, recordPath: recordPath100 }), processStartTime: null },
    {
      ...record({ pid: 101, prunable: true, recordPath: recordPath101 }),
      processStartTime: start(101),
    },
  ];
  running.set(101, null);
  const candidates = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([]);
  expect(candidates.map((candidate) => candidate.result)).toEqual(['unverified', 'unverified']);
  expect(running.has(100)).toBe(true);
  expect(running.has(101)).toBe(true);
  expect(fs.existsSync(recordPath100)).toBe(true);
  expect(fs.existsSync(recordPath101)).toBe(true);
});

test('pruneServers keeps the record of a signalled server whose start time cannot be read before SIGKILL', async () => {
  running.set(100, STUBBORN);
  const recordPath = writeRecordFile(100);
  records = [{ ...record({ pid: 100, prunable: true, recordPath }), processStartTime: STUBBORN }];
  // ps starts failing once the server has been sent SIGTERM.
  const kill = process.kill;
  process.kill = jest.fn((pid, signal) => {
    kill(pid, signal);
    if (signal === 'SIGTERM') {
      running.set(pid, null);
    }
  });
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([{ pid: 100, signal: 'SIGTERM' }]);
  expect(candidate.result).toEqual('unverified');
  expect(running.has(100)).toBe(true);
  expect(fs.existsSync(recordPath)).toBe(true);
});

test('pruneServers never signals or unregisters a candidate whose start time an older Lowdefy recorded as local time', async () => {
  running.set(100, start(100));
  const recordPath = writeRecordFile(100);
  records = [
    {
      ...record({ pid: 100, prunable: true, recordPath }),
      processStartTime: 'Fri Oct  2 20:55:31 2026',
    },
  ];
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([]);
  expect(candidate.result).toEqual('unverified');
  expect(fs.existsSync(recordPath)).toBe(true);
});

test('pruneServers adds unregistered legacy orphans only when asked, excluding registered pids', async () => {
  running.set(100, start(100));
  running.set(102, start(102));
  records = [record({ pid: 100, prunable: false })];
  mockFindLegacyOrphans.mockReturnValue([
    {
      pid: 102,
      processStartTime: start(102),
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
  running.set(100, start(100));
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

test('pruneServers lists an orphaned Vite child, and with kill signals it only while its start time still matches', async () => {
  const vite = {
    pid: 103,
    processStartTime: start(103),
    kind: 'vite',
    cwd: '/old/app/.lowdefy/dev',
    wrappers: [],
    reaper: 'pid 1',
  };
  running.set(103, start(103));
  mockFindLegacyOrphans.mockReturnValue([vite]);
  const listed = await pruneServers({ directory, includeLegacy: true });
  expect(listed).toMatchObject([
    {
      source: 'legacy',
      pid: 103,
      kind: 'vite',
      reason: 'its dev manager is gone; parent is pid 1',
    },
  ]);
  expect(signals).toEqual([]);

  running.set(103, SOMEONE_ELSE);
  const [skipped] = await pruneServers({ directory, includeLegacy: true, kill: true, graceMs: 50 });
  expect(signals).toEqual([]);
  expect(skipped.result).toEqual('gone');

  running.set(103, start(103));
  const [stopped] = await pruneServers({ directory, includeLegacy: true, kill: true, graceMs: 50 });
  expect(signals).toEqual([{ pid: 103, signal: 'SIGTERM' }]);
  expect(stopped.result).toEqual('stopped');
});

test('pruneServers with kill stops a server identified by its Linux boot id and ticks', async () => {
  const linuxStart = 'linux:3f2b8c1e-5d4a-4f6b-9c7d-0e1f2a3b4c5d:987654';
  running.set(100, linuxStart);
  records = [{ ...record({ pid: 100, prunable: true }), processStartTime: linuxStart }];
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([{ pid: 100, signal: 'SIGTERM' }]);
  expect(candidate.result).toEqual('stopped');
});

test('pruneServers with kill never signals a server whose record holds epoch milliseconds where Linux now reads ticks', async () => {
  running.set(100, 'linux:3f2b8c1e-5d4a-4f6b-9c7d-0e1f2a3b4c5d:987654');
  records = [record({ pid: 100, prunable: true })];
  const [candidate] = await pruneServers({ directory, kill: true, graceMs: 50 });
  expect(signals).toEqual([]);
  expect(candidate.result).toEqual('unverified');
  expect(running.has(100)).toBe(true);
});
