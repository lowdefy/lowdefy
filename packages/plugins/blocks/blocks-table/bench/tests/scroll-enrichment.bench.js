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

// Enrichment cells under scroll: the same 100k x 50 table with and without an enrichment and an
// ai column (every run state, done cells hashing their inputs for stale detection), run side by
// side in one session. The budget is scroll-fps's (p95 frame <= 16.7 ms, no long tasks); the
// enrichment variant should match its baseline.
const VARIANTS = [
  { name: 'baseline', enrich: false },
  { name: 'enrichment', enrich: true },
];

const SCENARIOS = [
  {
    name: 'wheel-slow',
    run: (page) => wheel({ page, delta: 40, intervalMs: 80, durationMs: 6000 }),
  },
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

SCENARIOS.forEach((scenario) => {
  VARIANTS.forEach((variant) => {
    test(`scroll-enrichment ${variant.name} ${scenario.name}`, async ({ page }) => {
      await setupTable({ page, rows: 100000, cols: 50, enrich: variant.enrich });
      const session = await page.context().newCDPSession(page);
      if (scenario.throttle) {
        await session.send('Emulation.setCPUThrottlingRate', { rate: scenario.throttle });
      }
      await page.evaluate(() => window.__bench.resetCounters());
      await startSampling(page);
      await scenario.run(page);
      const sample = await stopSampling(page);
      if (scenario.throttle) await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const react = await page.evaluate(() => {
        const durations = window.__bench.commits.map((commit) => commit.actualDuration);
        return {
          commits: durations.length,
          totalMs: durations.reduce((sum, duration) => sum + duration, 0),
        };
      });
      const result = {
        variant: variant.name,
        scenario: scenario.name,
        throttle: scenario.throttle ?? 1,
        ...summarize(sample),
        reactCommits: react.commits,
        reactMsPerCommit: Math.round((react.totalMs / Math.max(1, react.commits)) * 100) / 100,
      };
      writeResult({ name: `scroll-enrichment-${variant.name}-${scenario.name}`, result });
      process.stdout.write(`${JSON.stringify(result)}\n`);
    });
  });
});
