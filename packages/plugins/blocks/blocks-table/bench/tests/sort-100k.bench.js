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
import setupTable from '../lib/setupTable.js';
import writeResult from '../lib/writeResult.js';

// Budget (D10): sort 100k rows <= 50 ms (number) / <= 150 ms (text) main-thread blocking; INP of
// the sort click <= 100 ms. Blocking is the longest task between the click and the sorted paint.
const COLUMNS = [
  { key: 'score_6', kind: 'number' },
  { key: 'name_1', kind: 'text' },
];
const REPEATS = 5;

async function measureSortClick({ page, key, expected }) {
  await page.evaluate(() => window.__bench.resetCounters());
  await page.evaluate(() => {
    const probe = { longTasks: [], events: [], t0: null };
    window.__sortProbe = probe;
    probe.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => probe.longTasks.push(entry.duration));
    });
    probe.observer.observe({ type: 'longtask' });
    probe.eventObserver = new PerformanceObserver((list) => {
      list
        .getEntries()
        .forEach((entry) => probe.events.push({ name: entry.name, duration: entry.duration }));
    });
    probe.eventObserver.observe({ type: 'event', durationThreshold: 16 });
    document.addEventListener(
      'pointerdown',
      () => {
        probe.t0 = performance.now();
      },
      { capture: true, once: true }
    );
  });
  await page
    .locator(`#bench_table [data-lf-header][data-col-key="${key}"] .lf-table-header-title`)
    .click();
  return page.evaluate(
    ({ key, expected }) =>
      new Promise((resolve) => {
        const probe = window.__sortProbe;
        function poll() {
          const header = document.querySelector(
            `#bench_table [data-lf-header][data-col-key="${key}"]`
          );
          const pending = document.querySelector('#bench_table').hasAttribute('data-pending');
          if (header.getAttribute('aria-sort') === expected && !pending) {
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                const painted = performance.now();
                // Event timing entries are delivered after the next paint.
                setTimeout(() => {
                  probe.observer.disconnect();
                  probe.eventObserver.disconnect();
                  resolve({
                    clickToPaintMs: painted - probe.t0,
                    longestTaskMs: Math.max(0, ...probe.longTasks),
                    longTasks: probe.longTasks.length,
                    inpMs: Math.max(0, ...probe.events.map((entry) => entry.duration)),
                    // The render that applies the sort (row model sort + body) as React measures it.
                    maxCommitMs: Math.max(
                      0,
                      ...window.__bench.commits.map((commit) => commit.actualDuration)
                    ),
                  });
                }, 50);
              })
            );
            return;
          }
          requestAnimationFrame(poll);
        }
        poll();
      }),
    { key, expected }
  );
}

COLUMNS.forEach(({ key, kind }) => {
  test(`sort-100k ${kind}`, async ({ page }) => {
    const runs = [];
    for (let i = 0; i < REPEATS; i++) {
      await setupTable({ page, rows: 100000, cols: 50 });
      const cold = await measureSortClick({ page, key, expected: 'ascending' });
      const warm = await measureSortClick({ page, key, expected: 'descending' });
      const keysMs = await page.evaluate((args) => window.__bench.sortKeysMicro(args), { key });
      runs.push({ cold, warm, keysMs });
    }
    const result = {
      kind,
      key,
      repeats: REPEATS,
      coldClickToPaintMs: median(runs.map((run) => run.cold.clickToPaintMs)),
      coldLongestTaskMs: median(runs.map((run) => run.cold.longestTaskMs)),
      coldInpMs: median(runs.map((run) => run.cold.inpMs)),
      coldMaxCommitMs: median(runs.map((run) => run.cold.maxCommitMs)),
      warmClickToPaintMs: median(runs.map((run) => run.warm.clickToPaintMs)),
      warmLongestTaskMs: median(runs.map((run) => run.warm.longestTaskMs)),
      warmInpMs: median(runs.map((run) => run.warm.inpMs)),
      warmMaxCommitMs: median(runs.map((run) => run.warm.maxCommitMs)),
      sortKeysMs: median(runs.map((run) => run.keysMs)),
      runs,
    };
    writeResult({ name: `sort-100k-${kind}`, result });
    process.stdout.write(`${JSON.stringify({ ...result, runs: undefined })}\n`);
  });
});
