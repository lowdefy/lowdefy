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

import { test } from '@playwright/test';

import scrollProgrammatic from '../lib/scrollProgrammatic.js';
import setupTable from '../lib/setupTable.js';
import startSampling from '../lib/startSampling.js';
import stopSampling from '../lib/stopSampling.js';
import summarize from '../lib/summarize.js';
import wheel from '../lib/wheel.js';
import writeResult from '../lib/writeResult.js';

// Budget (D10): 100k x 50, p95 frame <= 16.7 ms, p99 <= 33 ms, 0 long tasks; >= 30 fps at 4x CPU
// throttle; blank area < 1% of frames at 3,000 px/s. Both row window strategies run, so the
// translated window can be compared with TanStack Virtual's per-row positioning.
const STRATEGIES = ['translated', 'positioned'];

async function taskSeconds(session) {
  const { metrics } = await session.send('Performance.getMetrics');
  return metrics.find((metric) => metric.name === 'TaskDuration').value;
}

const SCENARIOS = [
  // No input: the rAF timing jitter of this machine and runner, the floor under every p95.
  { name: 'idle', run: (page) => page.waitForTimeout(3000) },
  {
    name: 'wheel-slow',
    run: (page) => wheel({ page, delta: 40, intervalMs: 80, durationMs: 6000 }),
  },
  {
    name: 'wheel-fast',
    run: (page) => wheel({ page, delta: 400, intervalMs: 80, durationMs: 6000 }),
  },
  {
    name: 'wheel-horizontal',
    run: (page) => wheel({ page, delta: 300, intervalMs: 80, durationMs: 4000, axis: 'x' }),
  },
  {
    name: 'programmatic-3000',
    run: (page) => scrollProgrammatic({ page, pxPerSecond: 3000, durationMs: 6000 }),
  },
  {
    name: 'wheel-fast-cpu4x',
    throttle: 4,
    run: (page) => wheel({ page, delta: 400, intervalMs: 80, durationMs: 6000 }),
  },
];

STRATEGIES.forEach((strategy) => {
  SCENARIOS.forEach((scenario) => {
    test(`scroll-fps ${strategy} ${scenario.name}`, async ({ page }) => {
      await setupTable({ page, rows: 100000, cols: 50, strategy });
      const session = await page.context().newCDPSession(page);
      await session.send('Performance.enable');
      if (scenario.throttle) {
        await session.send('Emulation.setCPUThrottlingRate', { rate: scenario.throttle });
      }
      await page.evaluate(() => window.__bench.resetCounters());
      const before = await taskSeconds(session);
      await startSampling(page);
      const extra = await scenario.run(page);
      const sample = await stopSampling(page);
      const after = await taskSeconds(session);
      if (scenario.throttle) await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const react = await page.evaluate(() => {
        const durations = window.__bench.commits.map((commit) => commit.actualDuration);
        return {
          commits: durations.length,
          totalMs: durations.reduce((sum, duration) => sum + duration, 0),
          maxMs: Math.max(0, ...durations),
          rowRenders: window.__bench.renders.rows,
        };
      });
      const nodes = await page.evaluate(
        () => document.querySelector('#bench_table').querySelectorAll('*').length
      );
      const result = {
        strategy,
        scenario: scenario.name,
        throttle: scenario.throttle ?? 1,
        ...summarize(sample),
        // Main-thread task time per sampled frame (CDP TaskDuration), throttled time included.
        mainThreadMsPerFrame:
          Math.round(((after - before) * 1000 * 100) / Math.max(1, sample.frames.length)) / 100,
        reactCommits: react.commits,
        reactMsPerCommit: Math.round((react.totalMs / Math.max(1, react.commits)) * 100) / 100,
        reactMaxCommitMs: Math.round(react.maxMs * 100) / 100,
        rowRenders: react.rowRenders,
        domNodes: nodes,
      };
      if (extra) {
        result.blankFrames = extra.blankFrames;
        result.blankPercent =
          Math.round((extra.blankFrames / Math.max(1, extra.checkedFrames)) * 10000) / 100;
      }
      writeResult({ name: `scroll-${strategy}-${scenario.name}`, result });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  });
});
