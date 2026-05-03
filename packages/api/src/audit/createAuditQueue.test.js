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

import createAuditQueue from './createAuditQueue.js';

test('createAuditQueue flushes when buffer reaches size', async () => {
  const flushFn = jest.fn().mockResolvedValue(undefined);
  const q = createAuditQueue({ size: 3, interval: 60000, flushFn });
  q.enqueue({ id: 1 });
  q.enqueue({ id: 2 });
  expect(flushFn).not.toHaveBeenCalled();
  q.enqueue({ id: 3 });
  await new Promise((resolve) => setImmediate(resolve));
  expect(flushFn).toHaveBeenCalledTimes(1);
  expect(flushFn.mock.calls[0][0]).toHaveLength(3);
  await q.stop();
});

test('createAuditQueue flushes after interval elapses', async () => {
  const flushFn = jest.fn().mockResolvedValue(undefined);
  const q = createAuditQueue({ size: 100, interval: 50, flushFn });
  q.enqueue({ id: 1 });
  expect(flushFn).not.toHaveBeenCalled();
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(flushFn).toHaveBeenCalledTimes(1);
  await q.stop();
});

test('createAuditQueue.flush drains buffer immediately', async () => {
  const flushFn = jest.fn().mockResolvedValue(undefined);
  const q = createAuditQueue({ size: 100, interval: 60000, flushFn });
  q.enqueue({ id: 1 });
  q.enqueue({ id: 2 });
  await q.flush();
  expect(flushFn).toHaveBeenCalledTimes(1);
  expect(flushFn.mock.calls[0][0]).toHaveLength(2);
  await q.stop();
});

test('createAuditQueue.flush does nothing when buffer is empty', async () => {
  const flushFn = jest.fn();
  const q = createAuditQueue({ size: 100, interval: 60000, flushFn });
  await q.flush();
  expect(flushFn).not.toHaveBeenCalled();
  await q.stop();
});

test('createAuditQueue.stop flushes pending events and stops accepting new ones', async () => {
  const flushFn = jest.fn().mockResolvedValue(undefined);
  const q = createAuditQueue({ size: 100, interval: 60000, flushFn });
  q.enqueue({ id: 1 });
  await q.stop();
  expect(flushFn).toHaveBeenCalledTimes(1);
  q.enqueue({ id: 2 });
  await q.flush();
  expect(flushFn).toHaveBeenCalledTimes(1);
});

test('createAuditQueue invokes onError when flushFn rejects', async () => {
  const flushFn = jest.fn().mockRejectedValue(new Error('boom'));
  const onError = jest.fn();
  const q = createAuditQueue({ size: 100, interval: 60000, flushFn, onError });
  q.enqueue({ id: 1 });
  await q.flush();
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'boom' }));
  await q.stop();
});

test('createAuditQueue.pending reflects current buffer length', () => {
  const q = createAuditQueue({ size: 100, interval: 60000, flushFn: jest.fn() });
  expect(q.pending).toBe(0);
  q.enqueue({ id: 1 });
  q.enqueue({ id: 2 });
  expect(q.pending).toBe(2);
});
