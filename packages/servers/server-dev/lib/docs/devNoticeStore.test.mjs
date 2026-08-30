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
const { default: devNoticeStore } = await import('./devNoticeStore.js');

test('devNoticeStore push adds an entry and list returns it', () => {
  devNoticeStore.push({ message: 'first', configKey: 'k-first' });
  expect(devNoticeStore.list()).toEqual([{ message: 'first', configKey: 'k-first' }]);
});

test('devNoticeStore list returns a copy that does not alias the store', () => {
  const entries = devNoticeStore.list();
  entries.push({ message: 'not stored' });
  expect(devNoticeStore.list()).toEqual([{ message: 'first', configKey: 'k-first' }]);
});

test('devNoticeStore stores one notice per configKey per process', () => {
  devNoticeStore.push({ message: 'first again', configKey: 'k-first' });
  devNoticeStore.push({ message: 'first once more', configKey: 'k-first' });
  expect(devNoticeStore.list()).toEqual([{ message: 'first', configKey: 'k-first' }]);
});

test('devNoticeStore stores every notice that carries no configKey', () => {
  devNoticeStore.push({ message: 'no key' });
  devNoticeStore.push({ message: 'no key', configKey: null });
  expect(devNoticeStore.list()).toEqual([
    { message: 'first', configKey: 'k-first' },
    { message: 'no key' },
    { message: 'no key', configKey: null },
  ]);
});

test('devNoticeStore caps at 50 entries and drops the oldest', () => {
  for (let i = 0; i < 60; i++) {
    devNoticeStore.push({ index: i, configKey: `k-${i}` });
  }
  const entries = devNoticeStore.list();
  expect(entries.length).toEqual(50);
  expect(entries[0].index).toEqual(10);
  expect(entries[49].index).toEqual(59);
});

test('devNoticeStore keeps a dropped configKey deduped after it leaves the ring', () => {
  devNoticeStore.push({ index: 0, configKey: 'k-0' });
  const entries = devNoticeStore.list();
  expect(entries.length).toEqual(50);
  expect(entries[49].index).toEqual(59);
});
