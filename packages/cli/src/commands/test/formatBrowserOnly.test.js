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

import formatBrowserOnly from './formatBrowserOnly.js';

test('names the first step that needs a browser', () => {
  expect(
    formatBrowserOnly({
      result: {
        name: 'saves an item',
        browserOnly: {
          index: 3,
          step: { expect: { text: { blockId: 'save_success' } } },
          reason: 'expect "text" reads the page in a browser',
        },
      },
    })
  ).toBe(
    'BROWSER-ONLY  saves an item  step 3 (expect: { text }): expect "text" reads the page in a browser'
  );
});

test('says on open when opening the page needed a browser', () => {
  expect(
    formatBrowserOnly({
      result: {
        name: 'opens the task page',
        browserOnly: { phase: 'open', reason: 'Block "chain" is of type PluginChain, ...' },
      },
    })
  ).toBe('BROWSER-ONLY  opens the task page  on open: Block "chain" is of type PluginChain, ...');
});
