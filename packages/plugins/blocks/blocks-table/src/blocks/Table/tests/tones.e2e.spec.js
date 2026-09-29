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

// The WCAG contrast of each chip's text on its own fill, both painted over the backgrounds behind
// the chip, keyed by the chip's text.
function measureContrast(chips) {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const paint = (colours) => {
    context.clearRect(0, 0, 1, 1);
    colours.forEach((colour) => {
      context.fillStyle = colour;
      context.fillRect(0, 0, 1, 1);
    });
    return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
  };
  const luminance = (rgb) => {
    const [r, g, b] = rgb.map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  // The backgrounds from the page down to the element, outermost first, over the browser's
  // white canvas (a light page leaves html and body transparent).
  const backgrounds = (element) => {
    const layers = [];
    for (let node = element; node; node = node.parentElement) {
      layers.unshift(getComputedStyle(node).backgroundColor);
    }
    return ['#ffffff', ...layers];
  };
  const result = {};
  chips.forEach((chip) => {
    const layers = backgrounds(chip);
    const fill = paint(layers);
    const text = paint([...layers, getComputedStyle(chip).color]);
    result[chip.textContent.trim()] = Math.round(contrast(text, fill) * 100) / 100;
  });
  return result;
}

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
