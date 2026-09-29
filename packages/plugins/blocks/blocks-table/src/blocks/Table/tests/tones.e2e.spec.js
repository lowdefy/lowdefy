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
import { test, expect } from '@playwright/test';

import measureContrast from '../../../../e2e/measureContrast.js';
import openTablePage from '../../../../e2e/openTablePage.js';

const TONES = [
  'red',
  'volcano',
  'orange',
  'gold',
  'yellow',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
  'magenta',
  'pink',
  'success',
  'processing',
  'info',
  'warning',
  'error',
  'default',
  '#fadb14',
  '#13c2c2',
  '#722ed1',
  '#8c8c8c',
];

const CHIPS = {
  Table: '#tones_table .lf-table-body .lf-table-tag',
  TableLight: '#tones_light tbody .lf-table-tag',
  // HTML tags take their tone once HtmlComponent has enhanced the markup (data-lf-html).
  'HTML data-tag': '#tones_html[data-lf-html] [data-tag]',
};

for (const scheme of ['light', 'dark']) {
  test.describe(`tag tones in ${scheme} mode`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await openTablePage(page, 'tones');
      await expect(page.locator(CHIPS.Table)).toHaveCount(TONES.length);
      await expect(page.locator(CHIPS.TableLight)).toHaveCount(TONES.length);
      await expect(page.locator(CHIPS['HTML data-tag'])).toHaveCount(TONES.length);
    });

    for (const [name, selector] of Object.entries(CHIPS)) {
      test(`${name} chip text reads at 4.5:1 or more on its fill for every tone`, async ({
        page,
      }) => {
        const contrasts = await page.locator(selector).evaluateAll(measureContrast);
        expect(Object.keys(contrasts).sort()).toEqual([...TONES].sort());
        const failing = Object.entries(contrasts).filter(([, ratio]) => ratio < 4.5);
        expect(failing, JSON.stringify(contrasts)).toEqual([]);
      });
    }

    test('Table, TableLight and HTML draw the same tone the same way', async ({ page }) => {
      const read = (selector) =>
        page.locator(selector).evaluateAll((chips) =>
          chips.map((chip) => {
            const style = getComputedStyle(chip);
            return [chip.textContent.trim(), style.color, style.backgroundColor, style.borderColor];
          })
        );
      const table = await read(CHIPS.Table);
      expect(await read(CHIPS.TableLight)).toEqual(table);
      expect(await read(CHIPS['HTML data-tag'])).toEqual(table);
    });
  });
}
