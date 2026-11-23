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

import readOptionLabelText from './readOptionLabelText.js';

test('a block that draws html labels shows the html text', async () => {
  expect(
    await readOptionLabelText({
      block: { type: 'Selector' },
      label: '<span class="dot"></span><span>Sales &amp; Ops</span>',
    })
  ).toBe('Sales & Ops');
});

test('a block that draws plain labels, such as AutoComplete, shows the label as written', async () => {
  expect(await readOptionLabelText({ block: { type: 'AutoComplete' }, label: '<Other>' })).toBe(
    '<Other>'
  );
  expect(
    await readOptionLabelText({ block: { type: 'AutoComplete' }, label: 'Tom &amp; Jerry' })
  ).toBe('Tom &amp; Jerry');
});
