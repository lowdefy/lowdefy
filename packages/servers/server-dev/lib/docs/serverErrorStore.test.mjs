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

const { default: serverErrorStore } = await import('./serverErrorStore.js');

function entry(index) {
  return {
    timestamp: '2026-01-01T00:00:00.000Z',
    name: 'RequestError',
    message: `failed ${index}`,
    source: `pages/home.yaml:${index}`,
  };
}

test('serverErrorStore push adds an entry, list returns it, and it is published as a server_error event', () => {
  serverErrorStore.push(entry(0));
  expect(serverErrorStore.list()).toEqual([entry(0)]);
  expect(mockPublish).toHaveBeenCalledWith({ ...entry(0), type: 'server_error' });
});

test('serverErrorStore list returns a copy that does not alias the store', () => {
  const entries = serverErrorStore.list();
  entries.push({ message: 'not stored' });
  expect(serverErrorStore.list()).toEqual([entry(0)]);
});

test('serverErrorStore collapses the same name, message and source onto one counted entry', () => {
  mockPublish.mockClear();
  serverErrorStore.push({ ...entry(0), timestamp: '2026-01-01T00:00:01.000Z' });
  serverErrorStore.push({ ...entry(0), timestamp: '2026-01-01T00:00:02.000Z' });

  expect(serverErrorStore.list()).toEqual([
    { ...entry(0), count: 3, lastSeen: '2026-01-01T00:00:02.000Z' },
  ]);
  expect(mockPublish).not.toHaveBeenCalled();
});

test('serverErrorStore keeps errors that differ only in source apart', () => {
  serverErrorStore.push({ ...entry(0), source: 'pages/other.yaml:9' });
  expect(serverErrorStore.list().length).toEqual(2);
});

test('serverErrorStore caps at 50 entries and drops the oldest', () => {
  for (let i = 0; i < 60; i++) {
    serverErrorStore.push(entry(i));
  }
  const entries = serverErrorStore.list();
  expect(entries.length).toEqual(50);
  expect(entries[49].message).toEqual('failed 59');
});
