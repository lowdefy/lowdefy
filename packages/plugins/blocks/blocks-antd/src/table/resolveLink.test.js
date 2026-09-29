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

import resolveLink from './resolveLink.js';

test('resolveLink reads urlQuery values from the row and keeps the rest', () => {
  expect(
    resolveLink({
      link: { pageId: 'deal', urlQuery: { _id: '_id', tab: 'meta.tab' }, newTab: true, extra: 1 },
      row: { _id: 'd1', meta: { tab: 'notes' } },
    })
  ).toEqual({
    pageId: 'deal',
    href: undefined,
    home: undefined,
    back: undefined,
    newTab: true,
    input: undefined,
    urlQuery: { _id: 'd1', tab: 'notes' },
  });
});

test('resolveLink returns undefined without a link', () => {
  expect(resolveLink({ link: undefined, row: {} })).toBeUndefined();
});
