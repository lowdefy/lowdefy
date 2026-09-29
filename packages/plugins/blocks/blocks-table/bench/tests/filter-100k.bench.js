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

// Budget (D10): filter 100k rows <= 50 ms main-thread blocking. The filter is applied through the
// block method (the path the column filter popover and the toolbar share), timed from the call to
// the filtered paint. `filterMs` is the row model alone (compile + test every row), in the page.
const SCENARIOS = [
  { name: 'tag', filter: { key: 'status_3', op: 'in', value: ['won', 'lost'] } },
  { name: 'number', filter: { key: 'score_6', op: 'between', value: [100000, 400000] } },
  { name: 'text', filter: { key: 'name_1', op: 'contains', value: 'ka' } },
  {
    name: 'nested',
    filter: {
      and: [
        { key: 'status_3', op: 'in', value: ['won', 'lost', 'lead'] },
        {
          or: [
            { key: 'score_6', op: 'gte', value: 500000 },
            { key: 'owner_5', op: 'eq', value: 'Ada' },
          ],
        },
        { key: 'created_4', op: 'after', value: '2021-01-01' },
      ],
    },
  },
];
const REPEATS = 5;

async function measureApply({ page, call }) {
  await page.evaluate(() => window.__bench.resetCounters());
  return page.evaluate(
    (args) =>
      new Promise((resolve) => {
        const longTasks = [];
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => longTasks.push(entry.duration));
        });
        observer.observe({ type: 'longtask' });
        const root = document.querySelector('#bench_table');
        const grid = root.querySelector('[role="grid"]');
        const before = grid.getAttribute('aria-rowcount');
        const t0 = performance.now();
        window.__bench.methods[args.method](args.arg);
        function poll() {
          const changed = grid.getAttribute('aria-rowcount') !== before;
          if (changed && !root.hasAttribute('data-pending')) {
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                const painted = performance.now();
                setTimeout(() => {
                  observer.disconnect();
                  resolve({
                    callToPaintMs: painted - t0,
                    longestTaskMs: Math.max(0, ...longTasks),
                    maxCommitMs: Math.max(
                      0,
                      ...window.__bench.commits.map((commit) => commit.actualDuration)
                    ),
                    rows: Number(grid.getAttribute('aria-rowcount')) - 1,
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
    call
  );
}

function summarize(runs, key) {
  return {
    callToPaintMs: median(runs.map((run) => run[key].callToPaintMs)),
    longestTaskMs: median(runs.map((run) => run[key].longestTaskMs)),
    maxCommitMs: median(runs.map((run) => run[key].maxCommitMs)),
    rows: runs[0][key].rows,
  };
}

SCENARIOS.forEach(({ name, filter }) => {
  test(`filter-100k ${name}`, async ({ page }) => {
    const runs = [];
    for (let i = 0; i < REPEATS; i++) {
      await setupTable({ page, rows: 100000, cols: 50 });
      const apply = await measureApply({ page, call: { method: 'setFilter', arg: filter } });
      const clear = await measureApply({ page, call: { method: 'setFilter', arg: null } });
      const filterMs = await page.evaluate((arg) => window.__bench.filterMicro(arg), { filter });
      runs.push({ apply, clear, filterMs });
    }
    const result = {
      name,
      repeats: REPEATS,
      apply: summarize(runs, 'apply'),
      clear: summarize(runs, 'clear'),
      filterMs: median(runs.map((run) => run.filterMs)),
      runs,
    };
    writeResult({ name: `filter-100k-${name}`, result });
    process.stdout.write(`${JSON.stringify({ ...result, runs: undefined })}\n`);
  });
});

test('filter-100k search', async ({ page }) => {
  const runs = [];
  for (let i = 0; i < REPEATS; i++) {
    await setupTable({ page, rows: 100000, cols: 50 });
    const cold = await measureApply({ page, call: { method: 'setSearch', arg: 'ka' } });
    const warm = await measureApply({ page, call: { method: 'setSearch', arg: 'kalo' } });
    runs.push({ cold, warm });
  }
  const result = {
    name: 'search',
    repeats: REPEATS,
    cold: summarize(runs, 'cold'),
    warm: summarize(runs, 'warm'),
    runs,
  };
  writeResult({ name: 'filter-100k-search', result });
  process.stdout.write(`${JSON.stringify({ ...result, runs: undefined })}\n`);
});

test('filter-100k sorted text', async ({ page }) => {
  const runs = [];
  for (let i = 0; i < REPEATS; i++) {
    await setupTable({
      page,
      rows: 100000,
      cols: 50,
      properties: { defaultView: { sort: [{ key: 'name_1' }] } },
    });
    const apply = await measureApply({
      page,
      call: { method: 'setFilter', arg: SCENARIOS[0].filter },
    });
    runs.push({ apply });
  }
  const result = { name: 'sorted-text', repeats: REPEATS, apply: summarize(runs, 'apply'), runs };
  writeResult({ name: 'filter-100k-sorted-text', result });
  process.stdout.write(`${JSON.stringify({ ...result, runs: undefined })}\n`);
});
