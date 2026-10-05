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

import checkCharterPages from './checkCharterPages.js';

const headBuild = { pages: { invoice: {}, tickets: {} } };

test('checkCharterPages passes charters whose pages are in the head build, or that name none', () => {
  expect(() =>
    checkCharterPages({
      charters: [{ goal: 'a', pages: ['invoice'] }, { goal: 'b' }],
      headBuild,
    })
  ).not.toThrow();
});

test('checkCharterPages refuses an unknown page, naming the charter by its place and goal', () => {
  expect(() =>
    checkCharterPages({
      charters: [
        { goal: 'a', pages: ['invoice'] },
        { goal: 'Try error paths.', pages: ['bills'] },
      ],
      headBuild,
    })
  ).toThrow(
    'Charter 2 ("Try error paths.") names page "bills", which is not a page in the head build.'
  );
});
