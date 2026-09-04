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

import { getBlock } from './locators.js';

function createPage() {
  const selectors = [];
  const page = {
    selectors,
    locator: (selector) => {
      selectors.push(selector);
      return { selector, first: () => ({ selector, first: true }) };
    },
  };
  return page;
}

function selectorFor(blockId) {
  const page = createPage();
  getBlock(page, blockId);
  return page.selectors[0];
}

test('getBlock prefers the block root carrying the test id', () => {
  expect(selectorFor('submit').startsWith('[data-testid="submit"],')).toBe(true);
});

test('getBlock falls back to the layout wrapper only when it holds no block root', () => {
  expect(selectorFor('submit')).toBe(
    '[data-testid="submit"], #bl-submit:not(:has([data-testid="submit"]))'
  );
});

test('getBlock escapes block ids in the wrapper id selector', () => {
  expect(selectorFor('rows.0.edit')).toBe(
    '[data-testid="rows.0.edit"], #bl-rows\\.0\\.edit:not(:has([data-testid="rows.0.edit"]))'
  );
});

test('getBlock quotes the test id so a block id with a quote stays a valid selector', () => {
  expect(selectorFor('say"hi"')).toBe(
    '[data-testid="say\\"hi\\""], #bl-say\\"hi\\":not(:has([data-testid="say\\"hi\\""]))'
  );
});

test('getBlock resolves to the first match so a root routed into a portal keeps the wrapper', () => {
  const page = createPage();
  expect(getBlock(page, 'tooltip').first).toBe(true);
});
