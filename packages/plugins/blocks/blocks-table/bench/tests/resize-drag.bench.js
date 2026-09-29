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

import setupTable from '../lib/setupTable.js';
import startSampling from '../lib/startSampling.js';
import stopSampling from '../lib/stopSampling.js';
import summarize from '../lib/summarize.js';
import writeResult from '../lib/writeResult.js';

// Budget (D10): column resize drag at 60 fps with 0 body commits per frame. The render probe
// (bench page only) counts body and row renders during the drag; the width commits once on
// pointerup.
test('resize-drag 100k x 50', async ({ page }) => {
  await setupTable({ page, rows: 100000, cols: 50 });
  const handle = page.locator('#bench_table [data-lf-resize][data-col-key="name_1"]');
  const box = await handle.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.evaluate(() => window.__bench.resetCounters());
  await startSampling(page);
  for (let i = 1; i <= 120; i++) {
    await page.mouse.move(x + i * 2, y);
    await page.waitForTimeout(16);
  }
  const sample = await stopSampling(page);
  const during = await page.evaluate(() => ({
    body: window.__bench.renders.body,
    rows: window.__bench.renders.rows,
    commits: window.__bench.commits.length,
    setValue: window.__bench.setValueCount,
  }));
  await page.mouse.up();
  await page.evaluate(() => window.__bench.nextFrames(5));
  const after = await page.evaluate(() => ({
    body: window.__bench.renders.body,
    commits: window.__bench.commits.length,
    setValue: window.__bench.setValueCount,
    width: document
      .querySelector('#bench_table [data-lf-header][data-col-key="name_1"]')
      .getBoundingClientRect().width,
  }));
  const result = {
    ...summarize(sample),
    moves: 120,
    duringDrag: during,
    afterPointerUp: after,
  };
  writeResult({ name: 'resize-drag', result });
  process.stdout.write(`${JSON.stringify(result)}\n`);
});
