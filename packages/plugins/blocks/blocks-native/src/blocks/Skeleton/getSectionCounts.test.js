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

import getSectionCounts from './getSectionCounts.js';

test('getSectionCounts draws one section of count rows', () => {
  expect(getSectionCounts({ count: 5, fallback: 4 })).toEqual([5]);
});

test('getSectionCounts draws a section for each entry of a list', () => {
  expect(getSectionCounts({ count: [2, 4, 3], fallback: 4 })).toEqual([2, 4, 3]);
});

test('getSectionCounts draws one section of the fallback rows when count is not set', () => {
  expect(getSectionCounts({ fallback: 4 })).toEqual([4]);
});
