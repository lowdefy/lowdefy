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

import median from '../lib/median.js';
import writeResult from '../lib/writeResult.js';

// Budget (D10): first render 10k x 20 < 300 ms and 100k x 50 < 800 ms scripting; <= 3,000 DOM
// nodes in the viewport. Scripting is CDP ScriptDuration across the mount (data generation
// excluded), median of 5 fresh page loads.
const MATRIX = [
  { rows: 1000, cols: 10 },
  { rows: 10000, cols: 20 },
  { rows: 100000, cols: 50 },
];
const REPEATS = 5;

async function metrics(session) {
  const { metrics: list } = await session.send('Performance.getMetrics');
  return Object.fromEntries(list.map((metric) => [metric.name, metric.value]));
}

MATRIX.forEach(({ rows, cols }) => {
  test(`initial-render ${rows}x${cols}`, async ({ page }) => {
    const runs = [];
    for (let i = 0; i < REPEATS; i++) {
      await page.goto('/');
      await page.waitForFunction(() => window.__bench !== undefined);
      await page.evaluate((args) => window.__bench.generate(args), { rows, cols });
      const session = await page.context().newCDPSession(page);
      await session.send('Performance.enable');
      await session.send('HeapProfiler.collectGarbage');
      const before = await metrics(session);
      const mount = await page.evaluate(() => window.__bench.mount());
      const after = await metrics(session);
      const nodes = await page.evaluate(
        () => document.querySelector('#bench_table').querySelectorAll('*').length
      );
      runs.push({
        scriptingMs: (after.ScriptDuration - before.ScriptDuration) * 1000,
        taskMs: (after.TaskDuration - before.TaskDuration) * 1000,
        commitMs: mount.commitMs,
        paintMs: mount.paintMs,
        heapMb: after.JSHeapUsedSize / 1048576,
        domNodes: nodes,
      });
      await session.detach();
    }
    const result = {
      rows,
      cols,
      repeats: REPEATS,
      scriptingMs: median(runs.map((run) => run.scriptingMs)),
      taskMs: median(runs.map((run) => run.taskMs)),
      commitMs: median(runs.map((run) => run.commitMs)),
      paintMs: median(runs.map((run) => run.paintMs)),
      heapMb: median(runs.map((run) => run.heapMb)),
      domNodes: median(runs.map((run) => run.domNodes)),
      runs,
    };
    writeResult({ name: `initial-render-${rows}x${cols}`, result });
    process.stdout.write(`${JSON.stringify({ ...result, runs: undefined })}\n`);
  });
});
