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

import { vi, afterEach, expect, test } from 'vitest';

import sampleServerResources from './sampleServerResources.js';

const MB = 1024 * 1024;

// One ps line per process: rss in KiB, time as m:ss.
function table(rows) {
  return rows
    .map(
      ({ pid, ppid, rssMb, cpu }) =>
        `${pid} ${ppid} ${rssMb * 1024} 0:${String(cpu).padStart(2, '0')}`
    )
    .join('\n');
}

afterEach(() => {
  vi.useRealTimers();
});

test('sampleServerResources sums the whole process tree below the server, whatever its group', async () => {
  const readTable = vi.fn(async () =>
    table([
      { pid: 1, ppid: 0, rssMb: 999, cpu: 59 },
      { pid: 10, ppid: 1, rssMb: 100, cpu: 10 },
      // vite, then mongod and a browser in their own process groups below it.
      { pid: 11, ppid: 10, rssMb: 300, cpu: 20 },
      { pid: 12, ppid: 11, rssMb: 200, cpu: 5 },
      { pid: 13, ppid: 11, rssMb: 50, cpu: 3 },
      // Another app's server.
      { pid: 20, ppid: 1, rssMb: 700, cpu: 40 },
    ])
  );
  const sampler = sampleServerResources({ pid: 10, readTable, platform: 'darwin' });
  expect(await sampler.stop()).toEqual({ peakBytes: 650 * MB, cpuSeconds: 38 });
});

test('sampleServerResources keeps the peak memory and the last CPU time across samples', async () => {
  vi.useFakeTimers();
  const samples = [
    [{ pid: 10, ppid: 1, rssMb: 100, cpu: 1 }],
    [
      { pid: 10, ppid: 1, rssMb: 100, cpu: 5 },
      { pid: 11, ppid: 10, rssMb: 600, cpu: 20 },
    ],
    // A browser that exited between samples is gone from the last one.
    [{ pid: 10, ppid: 1, rssMb: 150, cpu: 9 }],
  ];
  const readTable = vi.fn(async () => table(samples.shift() ?? []));
  const sampler = sampleServerResources({
    pid: 10,
    readTable,
    intervalMs: 5000,
    platform: 'linux',
  });
  await vi.advanceTimersByTimeAsync(5000);
  expect(readTable).toHaveBeenCalledTimes(2);
  expect(await sampler.stop()).toEqual({ peakBytes: 700 * MB, cpuSeconds: 9 });
  expect(readTable).toHaveBeenCalledTimes(3);
  // Stopped: no more samples, and a second stop() answers the same.
  await vi.advanceTimersByTimeAsync(20000);
  expect(readTable).toHaveBeenCalledTimes(3);
  expect(await sampler.stop()).toEqual({ peakBytes: 700 * MB, cpuSeconds: 9 });
});

test('sampleServerResources resolves null when ps fails, prints nothing or lacks the server', async () => {
  const failing = sampleServerResources({
    pid: 10,
    platform: 'darwin',
    readTable: vi.fn(async () => {
      throw new Error('ps: not found');
    }),
  });
  expect(await failing.stop()).toBeNull();
  const empty = sampleServerResources({ pid: 10, platform: 'darwin', readTable: async () => '' });
  expect(await empty.stop()).toBeNull();
  const gone = sampleServerResources({
    pid: 10,
    platform: 'darwin',
    readTable: async () => table([{ pid: 20, ppid: 1, rssMb: 10, cpu: 1 }]),
  });
  expect(await gone.stop()).toBeNull();
});

test('sampleServerResources skips Windows, which has no ps', async () => {
  const readTable = vi.fn();
  const sampler = sampleServerResources({ pid: 10, readTable, platform: 'win32' });
  expect(await sampler.stop()).toBeNull();
  expect(readTable).not.toHaveBeenCalled();
});

test('sampleServerResources reads the real process table for this process', async () => {
  const sampler = sampleServerResources({ pid: process.pid });
  const measured = await sampler.stop();
  if (process.platform === 'win32') {
    expect(measured).toBeNull();
    return;
  }
  expect(measured.peakBytes).toBeGreaterThan(10 * MB);
  expect(measured.cpuSeconds).toBeGreaterThanOrEqual(0);
});
