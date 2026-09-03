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

const { default: clientErrorStore } = await import('./clientErrorStore.js');

test('clientErrorStore push adds an entry, lists it, and publishes it as a client_error event', () => {
  const entry = { timestamp: '2026-01-01T00:00:00.000Z', name: 'OperatorError', message: 'bad' };
  clientErrorStore.push(entry);
  expect(clientErrorStore.list()).toEqual([entry]);
  expect(mockPublish).toHaveBeenCalledWith({ ...entry, type: 'client_error' });
});

test('clientErrorStore collapses a repeated browser error onto one counted entry', () => {
  mockPublish.mockClear();
  clientErrorStore.push({
    timestamp: '2026-01-01T00:00:01.000Z',
    name: 'OperatorError',
    message: 'bad',
  });

  expect(clientErrorStore.list()).toEqual([
    {
      timestamp: '2026-01-01T00:00:00.000Z',
      name: 'OperatorError',
      message: 'bad',
      count: 2,
      lastSeen: '2026-01-01T00:00:01.000Z',
    },
  ]);
  expect(mockPublish).not.toHaveBeenCalled();
});

test('clientErrorStore caps at 50 entries and drops the oldest', () => {
  for (let i = 0; i < 60; i++) {
    clientErrorStore.push({ name: 'BlockError', message: `render ${i}` });
  }
  const entries = clientErrorStore.list();
  expect(entries.length).toEqual(50);
  expect(entries[49].message).toEqual('render 59');
});
