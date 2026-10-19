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

// Budget (D10): group by one column of 100k rows <= 150 ms main-thread blocking. Grouping is set
// through the setGroup method; blocking is the longest task between the call and the grouped
// paint, and the grouping render (tree build, flatten, body) is React's commit time.
const CASES = [
  { key: 'status_3', kind: 'tag-6-groups', aggregates: { amount_2: 'sum', score_6: 'avg' } },
  { key: 'owner_5', kind: 'text-8-groups', aggregates: { amount_2: 'sum' } },
  { key: 'name_1', kind: 'text-100k-groups', aggregates: {} },
];
const REPEATS = 5;

async function measure({ page, run }) {
  await page.evaluate(() => window.__bench.resetCounters());
  return page.evaluate(
    (action) =>
      new Promise((resolve) => {
        const longTasks = [];
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => longTasks.push(entry.duration));
        });
        observer.observe({ type: 'longtask' });
        const root = document.querySelector('#bench_table');
        const t0 = performance.now();
        const { methods } = window.__bench;
        if (action.type === 'group') methods.setGroup([action.key]);
        if (action.type === 'collapse') methods.collapseAllGroups();
        if (action.type === 'expand') methods.expandAllGroups();
        function done() {
          if (action.type === 'group') {
            return root.querySelector('.lf-table-body [data-group-key]') !== null;
          }
          const expanded = root.querySelector('.lf-table-body [data-group-key]').ariaExpanded;
          return expanded === (action.type === 'expand' ? 'true' : 'false');
        }
        function poll() {
          if (done() && !root.hasAttribute('data-pending')) {
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
    run
  );
}

CASES.forEach(({ key, kind, aggregates }) => {
  test(`group-100k ${kind}`, async ({ page }) => {
    const runs = [];
    for (let i = 0; i < REPEATS; i++) {
      await setupTable({
        page,
        rows: 100000,
        cols: 50,
        properties: { defaultColumn: { groupable: true }, defaultView: { aggregates } },
      });
      const group = await measure({ page, run: { type: 'group', key } });
      const collapse = await measure({ page, run: { type: 'collapse' } });
      const expand = await measure({ page, run: { type: 'expand' } });
      runs.push({ group, collapse, expand });
    }
    const result = {
      kind,
      key,
      repeats: REPEATS,
      groupCallToPaintMs: median(runs.map((run) => run.group.callToPaintMs)),
      groupLongestTaskMs: median(runs.map((run) => run.group.longestTaskMs)),
      groupMaxCommitMs: median(runs.map((run) => run.group.maxCommitMs)),
      collapseMaxCommitMs: median(runs.map((run) => run.collapse.maxCommitMs)),
      collapseLongestTaskMs: median(runs.map((run) => run.collapse.longestTaskMs)),
      expandMaxCommitMs: median(runs.map((run) => run.expand.maxCommitMs)),
      expandLongestTaskMs: median(runs.map((run) => run.expand.longestTaskMs)),
      runs,
    };
    writeResult({ name: `group-100k-${kind}`, result });
    process.stdout.write(`${JSON.stringify({ ...result, runs: undefined })}\n`);
  });
});
