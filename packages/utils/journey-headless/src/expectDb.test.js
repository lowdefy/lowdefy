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

import { expect, test, vi } from 'vitest';

import expectDb from './expectDb.js';

function createHost(findDocuments) {
  return { findDocuments };
}

test('expectDb reads the host with the step query and passes on the count', async () => {
  const findDocuments = vi.fn(async () => [{ _id: 'a' }]);
  await expectDb({
    host: createHost(findDocuments),
    params: { collection: 'items', connectionId: 'fixture_db', match: { kind: 'x' }, count: 1 },
    timeout: 0,
  });
  expect(findDocuments).toHaveBeenCalledWith({
    collection: 'items',
    connectionId: 'fixture_db',
    match: { kind: 'x' },
  });
});

test('expectDb waits for a write that lands after the step began', async () => {
  const findDocuments = vi
    .fn()
    .mockResolvedValueOnce([])
    .mockResolvedValue([{ _id: 'a' }]);
  await expectDb({
    host: createHost(findDocuments),
    params: { collection: 'items', match: {}, count: 1 },
    timeout: 1000,
  });
  expect(findDocuments).toHaveBeenCalledTimes(2);
});

test('expectDb fails naming the count it found', async () => {
  const host = createHost(async () => [{ _id: 'a' }, { _id: 'b' }]);
  await expect(
    expectDb({ host, params: { collection: 'items', match: { kind: 'x' }, count: 0 }, timeout: 0 })
  ).rejects.toMatchObject({
    message: 'Expected 0 documents in "items" matching {"kind":"x"} but found 2.',
    expected: 0,
    actual: 2,
  });
});

test('expectDb matches equals item for item, each document holding the keys given', async () => {
  const host = createHost(async () => [{ _id: 'a', kind: 'x', at: 1 }]);
  await expectDb({
    host,
    params: { collection: 'items', match: {}, equals: [{ kind: 'x' }] },
    timeout: 0,
  });
  await expect(
    expectDb({
      host,
      params: { collection: 'items', match: {}, equals: [{ kind: 'y' }] },
      timeout: 0,
    })
  ).rejects.toThrow('Expected the documents in "items" matching {} to be [{"kind":"y"}]:');
});

test('expectDb fails with what the host could not read', async () => {
  const host = createHost(async () => {
    throw new Error('Connection "api" is not a MongoDBCollection.');
  });
  await expect(
    expectDb({
      host,
      params: { collection: 'items', connectionId: 'api', match: {}, count: 0 },
      timeout: 0,
    })
  ).rejects.toMatchObject({
    name: 'HeadlessStepError',
    message: 'Connection "api" is not a MongoDBCollection.',
  });
});
