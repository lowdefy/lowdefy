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

// Real wheel input (compositor scroll): `delta` px every `intervalMs` for `durationMs`.
async function wheel({ page, delta, intervalMs, durationMs, axis = 'y' }) {
  const box = await page.locator('#bench_table .lf-table-scroller').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const started = Date.now();
  while (Date.now() - started < durationMs) {
    if (axis === 'y') {
      await page.mouse.wheel(0, delta);
    } else {
      await page.mouse.wheel(delta, 0);
    }
    await page.waitForTimeout(intervalMs);
  }
}

export default wheel;
