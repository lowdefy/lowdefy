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

// Wrapped rows (D10.1): two text columns wrap at 90 px, so every data row is measured and rows
// differ in height. Scrolling keeps reaching rows that were never measured; each window render
// reports their heights and the row offsets (item tops) change. The frame budget is the scroll
// budget's; column virtualisation is off, as a wrapped row's height depends on every cell.
const WRAP = ['name_1', 'name_13'];

async function taskSeconds(session) {
  const { metrics } = await session.send('Performance.getMetrics');
  return metrics.find((metric) => metric.name === 'TaskDuration').value;
}

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
    name: 'programmatic-3000-cpu4x',
    throttle: 4,
    run: (page) => scrollProgrammatic({ page, pxPerSecond: 3000, durationMs: 6000 }),
  },
];

[10, 50].forEach((cols) => {
  SCENARIOS.forEach((scenario) => {
    test(`scroll-wrap ${cols} cols ${scenario.name}`, async ({ page }) => {
      await setupTable({ page, rows: 100000, cols, wrap: WRAP });
      const session = await page.context().newCDPSession(page);
      await session.send('Performance.enable');
      if (scenario.throttle) {
        await session.send('Emulation.setCPUThrottlingRate', { rate: scenario.throttle });
      }
      await page.evaluate(() => window.__bench.resetCounters());
      const before = await taskSeconds(session);
      await startSampling(page);
      await scenario.run(page);
      const sample = await stopSampling(page);
      const after = await taskSeconds(session);
      if (scenario.throttle) await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const react = await page.evaluate(() => {
        const durations = window.__bench.commits.map((commit) => commit.actualDuration);
        return {
          commits: durations.length,
          totalMs: durations.reduce((sum, duration) => sum + duration, 0),
          maxMs: Math.max(0, ...durations),
        };
      });
      const result = {
        cols,
        scenario: scenario.name,
        throttle: scenario.throttle ?? 1,
        ...summarize(sample),
        mainThreadMsPerFrame:
          Math.round(((after - before) * 1000 * 100) / Math.max(1, sample.frames.length)) / 100,
        reactCommits: react.commits,
        reactMsPerCommit: Math.round((react.totalMs / Math.max(1, react.commits)) * 100) / 100,
        reactMaxCommitMs: Math.round(react.maxMs * 100) / 100,
      };
      writeResult({ name: `scroll-wrap-${cols}-${scenario.name}`, result });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  });
});
