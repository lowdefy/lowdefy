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

import { expect, test } from 'vitest';

import runTestJourney, { readLog, record } from './tests/runTestJourney.js';

function page(properties = {}) {
  return {
    id: 'home',
    blocks: [
      {
        id: 'amount',
        type: 'NumberInput',
        properties,
        events: { onChange: [record('onChange')], onPressEnter: [record('onPressEnter')] },
      },
    ],
  };
}

async function fill({ i18n, properties, values }) {
  return runTestJourney({
    i18n,
    pages: [page(properties)],
    steps: [...values.map((value) => ({ fill: { blockId: 'amount', value } })), { press: 'Enter' }],
  });
}

test('A fill sets a NumberInput to the number typed and fires onChange with it', async () => {
  const { log, result } = await fill({ values: ['120000'] });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onChange', { value: 120000 }], ['onPressEnter']]);
});

test('The default parser drops grouping and swaps the decimal separator', async () => {
  const { log } = await fill({ values: ['$ 1 234.5', '1,5'] });
  expect(readLog(log)).toEqual([
    ['onChange', { value: 1234.5 }],
    ['onChange', { value: 15 }],
    ['onPressEnter'],
  ]);
});

test('A decimalSeparator property is the one swapped for a point', async () => {
  const { log } = await fill({ properties: { decimalSeparator: ',' }, values: ['12,5'] });
  expect(readLog(log)).toEqual([['onChange', { value: 12.5 }], ['onPressEnter']]);
});

test('Text that is no number, or the number the input holds, changes nothing', async () => {
  const { log, result } = await fill({ values: ['7', 'abc', '-', '7'] });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onChange', { value: 7 }], ['onPressEnter']]);
});

test('A number outside min and max changes nothing while typing', async () => {
  const { log } = await fill({ properties: { min: 1, max: 10 }, values: ['11', '0', '10'] });
  expect(readLog(log)).toEqual([['onChange', { value: 10 }], ['onPressEnter']]);
});

test('Empty text clears the value to null', async () => {
  const { log } = await fill({ values: ['3', ''] });
  expect(readLog(log)).toEqual([
    ['onChange', { value: 3 }],
    ['onChange', { value: null }],
    ['onPressEnter'],
  ]);
});

test('A number in e notation reads as Number does', async () => {
  const { log } = await fill({ values: ['1e3'] });
  expect(readLog(log)).toEqual([['onChange', { value: 1000 }], ['onPressEnter']]);
});

test('A NumberInput with its own parser runs in a browser', async () => {
  const { log, result } = await fill({ properties: { parser: 'x' }, values: ['5'] });
  expect(result.browserOnly).toEqual({
    index: 0,
    reason:
      'Block "amount" (NumberInput) reads typed text with its own parser, which a headless run does not model: the step runs in a browser.',
    step: { fill: { blockId: 'amount', value: '5' } },
  });
  expect(log).toEqual([]);
});

test("Under i18n, text whose meaning hangs on the locale's separator runs in a browser", async () => {
  const i18n = { defaultLocale: 'en', locales: ['en', 'de'] };
  const plain = await fill({ i18n, values: ['1200'] });
  expect(plain.result.passed).toBe(true);
  const { result } = await fill({ i18n, values: ['1,5'] });
  expect(result.browserOnly.reason).toBe(
    'Block "amount" (NumberInput) reads "1,5" with the decimal separator of the browser\'s locale, which a headless run does not know: the step runs in a browser.'
  );
});

test('Enter after a number outside min and max runs in a browser, which clamps it', async () => {
  const { log, result } = await fill({ properties: { max: 10 }, values: ['11'] });
  expect(result.browserOnly).toEqual({
    index: 1,
    reason:
      'Enter in block "amount" (NumberInput) clamps 11 to its min and max and fires onChange, which a headless run does not model: the step runs in a browser.',
    step: { press: 'Enter' },
  });
  expect(log).toEqual([]);
});

test('Enter after more decimals than its precision runs in a browser, which rounds them', async () => {
  const { log, result } = await fill({ properties: { precision: 2 }, values: ['1.234'] });
  expect(result.browserOnly.reason).toBe(
    'Enter in block "amount" (NumberInput) rounds 1.234 to its precision and fires onChange, which a headless run does not model: the step runs in a browser.'
  );
  expect(readLog(log)).toEqual([['onChange', { value: 1.234 }]]);
});

test('Enter after a number its precision holds, or text that is no number, runs headless', async () => {
  const { log, result } = await fill({ properties: { precision: 2 }, values: ['1.50', 'abc'] });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onChange', { value: 1.5 }], ['onPressEnter']]);
});

test('An app with no i18n, which the build writes as {}, reads a point as the separator', async () => {
  const { log, result } = await fill({ i18n: {}, values: ['1.5'] });
  expect(result.passed).toBe(true);
  expect(readLog(log)).toEqual([['onChange', { value: 1.5 }], ['onPressEnter']]);
});
