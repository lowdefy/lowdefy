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

// Server mode (performance.md §8: mocked 50 ms latency, fast scroll): rows that are not loaded
// render as skeleton rows while the blocks behind them load, so this is where skeleton cost
// shows. Same frame budget as the client scroll (D10). `skeletonFrames` is the share of sampled
// frames with at least one skeleton row on screen.
const SCENARIOS = [
  {
    name: 'wheel-fast',
    run: (page) => wheel({ page, delta: 400, intervalMs: 80, durationMs: 6000 }),
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

async function startSkeletonCount(page) {
  await page.evaluate(() => {
    const counter = { frames: 0, withSkeleton: 0, running: true };
    window.__skeletons = counter;
    function tick() {
      if (!counter.running) return;
      counter.frames += 1;
      if (document.querySelector('#bench_table .lf-table-body [data-skeleton]')) {
        counter.withSkeleton += 1;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

SCENARIOS.forEach((scenario) => {
  test(`server-scroll ${scenario.name}`, async ({ page }) => {
    await setupTable({
      page,
      rows: 100000,
      cols: 50,
      properties: { data: { mode: 'server', request: 'bench_rows', blockSize: 200 } },
    });
    const session = await page.context().newCDPSession(page);
    if (scenario.throttle) {
      await session.send('Emulation.setCPUThrottlingRate', { rate: scenario.throttle });
    }
    await page.evaluate(() => window.__bench.resetCounters());
    await startSkeletonCount(page);
    await startSampling(page);
    await scenario.run(page);
    const sample = await stopSampling(page);
    const skeletons = await page.evaluate(() => {
      window.__skeletons.running = false;
      return window.__skeletons;
    });
    if (scenario.throttle) await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const react = await page.evaluate(() => {
      const durations = window.__bench.commits.map((commit) => commit.actualDuration);
      return {
        commits: durations.length,
        maxMs: Math.max(0, ...durations),
        fetches: window.__bench.fetches,
      };
    });
    const result = {
      scenario: scenario.name,
      throttle: scenario.throttle ?? 1,
      ...summarize(sample),
      reactCommits: react.commits,
      reactMaxCommitMs: Math.round(react.maxMs * 100) / 100,
      fetches: react.fetches,
      skeletonFramesPercent:
        Math.round((skeletons.withSkeleton / Math.max(1, skeletons.frames)) * 10000) / 100,
    };
    writeResult({ name: `server-scroll-${scenario.name}`, result });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  });
});
