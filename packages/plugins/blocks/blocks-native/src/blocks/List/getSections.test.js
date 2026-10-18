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

import getSections from './getSections.js';

test('getSections groups neighbouring items with the same key', () => {
  const value = [{ g: 'a' }, { g: 'a' }, { g: 'b' }, { g: 'a' }];
  expect(getSections({ count: 4, sectionKey: 'g', value })).toEqual([
    { title: 'a', data: [0, 1] },
    { title: 'b', data: [2] },
    { title: 'a', data: [3] },
  ]);
});

test('getSections puts items without the key under an empty title', () => {
  expect(getSections({ count: 2, sectionKey: 'g', value: [{}, { g: 1 }] })).toEqual([
    { title: '', data: [0] },
    { title: '1', data: [1] },
  ]);
});
