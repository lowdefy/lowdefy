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

import { execFile } from 'child_process';

import parseResourceTable from './parseResourceTable.js';

const SAMPLE_INTERVAL_MS = 5000;

function readResourceTable() {
  return new Promise((resolve, reject) => {
    execFile(
      'ps',
      ['-A', '-o', 'pid=,ppid=,rss=,time='],
      { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' }, maxBuffer: 64 * 1024 * 1024 },
      (error, stdout) => (error ? reject(error) : resolve(stdout))
    );
  });
}

// The pid and every process below it in the ppid tree, whatever process
// group each is in, so the data store's mongod and the journey browsers count.
function sumProcessTree({ processes, pid }) {
  const children = new Map();
  processes.forEach((entry) => {
    if (!children.has(entry.ppid)) {
      children.set(entry.ppid, []);
    }
    children.get(entry.ppid).push(entry);
  });
  const root = processes.find((entry) => entry.pid === pid);
  if (root === undefined) {
    return null;
  }
  const total = { rssBytes: 0, cpuSeconds: 0 };
  const queue = [root];
  const seen = new Set();
  while (queue.length > 0) {
    const entry = queue.shift();
    if (!seen.has(entry.pid)) {
      seen.add(entry.pid);
      total.rssBytes += entry.rssBytes;
      total.cpuSeconds += entry.cpuSeconds;
      queue.push(...(children.get(entry.pid) ?? []));
    }
  }
  return total;
}

/*
Samples the memory and CPU of a server this run started, every 5 s while
the run holds it: the resident memory summed over the server's process tree,
and its CPU time. stop() takes a last sample, stops sampling and resolves
{ peakBytes, cpuSeconds }: the highest sum seen, and the last sample's CPU
time, which for a server this run started is the run's whole cost. It
resolves null when no sample could be read, and on Windows, which has no
ps. Processes that exit between samples are missed, so the figures are
approximate. The timer never keeps the CLI alive.
*/
function sampleServerResources({
  pid,
  intervalMs = SAMPLE_INTERVAL_MS,
  platform = process.platform,
  readTable = readResourceTable,
}) {
  if (platform === 'win32') {
    return { stop: async () => null };
  }
  let peakBytes = 0;
  let cpuSeconds = null;
  let inFlight = null;

  async function sample() {
    try {
      const total = sumProcessTree({ processes: parseResourceTable(await readTable()), pid });
      if (total !== null) {
        peakBytes = Math.max(peakBytes, total.rssBytes);
        cpuSeconds = total.cpuSeconds;
      }
    } catch {
      // A failed read is a missed sample.
    }
  }

  function tick() {
    if (inFlight === null) {
      inFlight = sample().finally(() => {
        inFlight = null;
      });
    }
  }

  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  let stopped;

  function stop() {
    stopped =
      stopped ??
      (async () => {
        clearInterval(timer);
        await inFlight;
        await sample();
        return cpuSeconds === null ? null : { peakBytes, cpuSeconds };
      })();
    return stopped;
  }

  return { stop };
}

export default sampleServerResources;
