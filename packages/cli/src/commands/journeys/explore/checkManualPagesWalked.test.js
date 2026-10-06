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

import checkManualPagesWalked from './checkManualPagesWalked.js';

test('checkManualPagesWalked refuses --page when every charter names its own pages', () => {
  expect(() =>
    checkManualPagesWalked({
      charters: [
        { goal: 'a', pages: ['invoice'] },
        { goal: 'b', pages: ['tickets'] },
      ],
      manualPages: ['settings', 'profile'],
    })
  ).toThrow(
    '--page "settings", "profile" would not be walked: every charter names its own pages. Add the pages to a charter, or leave one charter without pages to walk them.'
  );
});

test('checkManualPagesWalked passes --page when a charter names no pages, so it walks them', () => {
  expect(() =>
    checkManualPagesWalked({
      charters: [{ goal: 'a', pages: ['invoice'] }, { goal: 'b' }],
      manualPages: ['settings'],
    })
  ).not.toThrow();
});

test('checkManualPagesWalked passes a run without --page or without charters', () => {
  expect(() =>
    checkManualPagesWalked({ charters: [{ goal: 'a', pages: ['invoice'] }], manualPages: [] })
  ).not.toThrow();
  expect(() => checkManualPagesWalked({ charters: [], manualPages: ['settings'] })).not.toThrow();
});
