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

import { jest } from '@jest/globals';

const mockPublish = jest.fn();
jest.unstable_mockModule('./devEventBus.js', () => ({
  publish: mockPublish,
}));

const { default: devNoticeStore } = await import('./devNoticeStore.js');

test('devNoticeStore push adds an entry, list returns it and it is published as a dev_notice event', () => {
  devNoticeStore.push({ message: 'first', configKey: 'k-first' });
  expect(devNoticeStore.list()).toEqual([{ message: 'first', configKey: 'k-first' }]);
  expect(mockPublish).toHaveBeenCalledWith({
    message: 'first',
    configKey: 'k-first',
    type: 'dev_notice',
  });
});

test('devNoticeStore list returns a copy that does not alias the store', () => {
  const entries = devNoticeStore.list();
  entries.push({ message: 'not stored' });
  expect(devNoticeStore.list()).toEqual([{ message: 'first', configKey: 'k-first' }]);
});

test('devNoticeStore stores one notice per configKey and counts the repeats', () => {
  devNoticeStore.push({ message: 'first again', configKey: 'k-first', timestamp: 't1' });
  devNoticeStore.push({ message: 'first once more', configKey: 'k-first', timestamp: 't2' });
  expect(devNoticeStore.list()).toEqual([
    { message: 'first', configKey: 'k-first', count: 3, lastSeen: 't2' },
  ]);
});

test('devNoticeStore stores every notice that carries no configKey', () => {
  devNoticeStore.push({ message: 'no key' });
  devNoticeStore.push({ message: 'no key', configKey: null });
  expect(devNoticeStore.list().length).toEqual(3);
});

test('devNoticeStore caps at 50 entries and drops the oldest', () => {
  for (let i = 0; i < 60; i++) {
    devNoticeStore.push({ index: i, configKey: `k-${i}` });
  }
  const entries = devNoticeStore.list();
  expect(entries.length).toEqual(50);
  expect(entries[49].index).toEqual(59);
});

test('devNoticeStore reports a config site again once its entry has left the ring', () => {
  // The first ten sites were evicted by the loop above, so the site is news
  // again - an app with more sites than the ring holds shows the recent ones
  // rather than an arbitrary first fifty.
  expect(devNoticeStore.push({ index: 0, configKey: 'k-0' })).toBe(true);
  const entries = devNoticeStore.list();
  expect(entries.length).toEqual(50);
  expect(entries[49]).toEqual({ index: 0, configKey: 'k-0' });
});
