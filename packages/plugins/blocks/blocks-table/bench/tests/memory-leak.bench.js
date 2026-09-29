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
import writeResult from '../lib/writeResult.js';

// Budget (D10): 60 s of scrolling, forced GC before and after, heap growth < 5%.
test('memory-leak 60s scroll', async ({ page }) => {
  await setupTable({ page, rows: 100000, cols: 50 });
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  async function heap() {
    await session.send('HeapProfiler.collectGarbage');
    await session.send('HeapProfiler.collectGarbage');
    const { metrics } = await session.send('Performance.getMetrics');
    return metrics.find((metric) => metric.name === 'JSHeapUsedSize').value;
  }
  // Warm up once so lazily built caches (sort keys aside) exist before the baseline.
  await scrollProgrammatic({ page, pxPerSecond: 3000, durationMs: 3000, bounce: true });
  const before = await heap();
  for (let i = 0; i < 10; i++) {
    await scrollProgrammatic({ page, pxPerSecond: 3000, durationMs: 5000, bounce: true });
    await scrollProgrammatic({ page, pxPerSecond: 2000, durationMs: 1000, axis: 'x' });
  }
  const after = await heap();
  const result = {
    durationS: 60,
    heapBeforeMb: Math.round((before / 1048576) * 100) / 100,
    heapAfterMb: Math.round((after / 1048576) * 100) / 100,
    growthPercent: Math.round(((after - before) / before) * 10000) / 100,
  };
  writeResult({ name: 'memory-leak', result });
  process.stdout.write(`${JSON.stringify(result)}\n`);
});
