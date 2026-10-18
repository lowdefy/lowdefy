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
    { key: 'a', title: 'a', count: undefined, data: [0, 1] },
    { key: 'b', title: 'b', count: undefined, data: [2] },
    { key: 'a', title: 'a', count: undefined, data: [3] },
  ]);
});

test('getSections puts items without the key under an empty title', () => {
  expect(getSections({ count: 2, sectionKey: 'g', value: [{}, { g: 1 }] })).toEqual([
    { key: '', title: '', count: undefined, data: [0] },
    { key: '1', title: '1', count: undefined, data: [1] },
  ]);
});

test('getSections counts each section with showCount', () => {
  const value = [{ g: 'a' }, { g: 'a' }, { g: 'b' }];
  expect(
    getSections({ count: 3, sectionKey: 'g', showCount: true, value }).map(({ count }) => count)
  ).toEqual([2, 1]);
});

test('getSections makes one section titled by header without a sectionKey', () => {
  expect(getSections({ count: 2, header: 'Tasks', value: [{}, {}] })).toEqual([
    {
      key: '',
      title: 'Tasks',
      count: undefined,
      footer: undefined,
      status: undefined,
      data: [0, 1],
    },
  ]);
  expect(
    getSections({
      count: 2,
      header: { title: 'Tasks', status: 'todo' },
      showCount: true,
      value: [],
    })[0]
  ).toMatchObject({ title: 'Tasks', count: 2, status: 'todo' });
  expect(getSections({ count: 1, value: [{}] })[0].title).toBeUndefined();
});

test('getSections orders items by sections, whatever the list order', () => {
  const value = [{ s: 'todo' }, { s: 'doing' }, { s: 'todo' }, { s: 'other' }];
  const sections = [
    { key: 'doing', title: 'In progress', status: 'inProgress' },
    { key: 'review', title: 'In review' },
    { key: 'todo', title: 'Todo', count: '2 left' },
  ];
  expect(getSections({ count: 4, sectionKey: 's', sections, showCount: true, value })).toEqual([
    {
      key: 'doing',
      title: 'In progress',
      count: 1,
      footer: undefined,
      status: 'inProgress',
      data: [1],
    },
    {
      key: 'todo',
      title: 'Todo',
      count: '2 left',
      footer: undefined,
      status: undefined,
      data: [0, 2],
    },
    { key: 'other', title: 'other', count: 1, footer: undefined, status: undefined, data: [3] },
  ]);
});
