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

// Budget (D10): updating 1 row of 100k <= 5 ms with exactly 1 row re-rendered. The update is a
// new `data` array with one new row object (the P1 path; `applyTransaction` arrives with P3).
test('row-update 1 of 100k', async ({ page }) => {
  await setupTable({ page, rows: 100000, cols: 50 });
  const runs = [];
  for (let index = 3; index < 8; index++) {
    await page.evaluate(() => window.__bench.resetCounters());
    const update = await page.evaluate((i) => window.__bench.updateRow(i), index);
    const renders = await page.evaluate(() => ({
      rows: window.__bench.renders.rows,
      rowKeys: window.__bench.renders.rowKeys,
      body: window.__bench.renders.body,
      reactMs: window.__bench.commits.reduce((sum, commit) => sum + commit.actualDuration, 0),
    }));
    runs.push({ index, ...update, ...renders });
  }
  const result = {
    commitMs: median(runs.map((run) => run.commitMs)),
    reactRenderMs: median(runs.map((run) => run.reactMs)),
    rowsRendered: median(runs.map((run) => run.rows)),
    runs,
  };
  writeResult({ name: 'row-update', result });
  process.stdout.write(`${JSON.stringify(result)}\n`);
});
