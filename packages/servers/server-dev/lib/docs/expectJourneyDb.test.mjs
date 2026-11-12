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

import { vi, beforeEach, expect, test } from 'vitest';

const mockFindSessionDocuments = vi.fn();
vi.doMock('@lowdefy/test-utils/dataSets', async (importOriginal) => ({
  ...(await importOriginal()),
  findSessionDocuments: mockFindSessionDocuments,
}));

const { default: expectJourneyDb } = await import('./expectJourneyDb.js');

const journey = {
  buildDirectory: '/app/build',
  dataSession: { session: { id: 'session-1' } },
  dataStore: { client: { id: 'client' } },
};

beforeEach(() => {
  mockFindSessionDocuments.mockReset();
});

test('expectJourneyDb reads the data session with the step query and passes on the count', async () => {
  mockFindSessionDocuments.mockResolvedValue([{ _id: 'a' }]);
  await expectJourneyDb({
    journey,
    params: { collection: 'items', connectionId: 'fixture_db', match: { kind: 'x' }, count: 1 },
    timeout: 0,
  });
  expect(mockFindSessionDocuments).toHaveBeenCalledWith({
    buildDirectory: '/app/build',
    client: journey.dataStore.client,
    collection: 'items',
    connectionId: 'fixture_db',
    match: { kind: 'x' },
    session: journey.dataSession.session,
  });
});

test('expectJourneyDb waits for a write that lands after the step began', async () => {
  mockFindSessionDocuments.mockResolvedValueOnce([]).mockResolvedValue([{ _id: 'a' }]);
  await expectJourneyDb({
    journey,
    params: { collection: 'items', match: {}, count: 1 },
    timeout: 1000,
  });
  expect(mockFindSessionDocuments).toHaveBeenCalledTimes(2);
});

test('expectJourneyDb fails naming the count it found', async () => {
  mockFindSessionDocuments.mockResolvedValue([{ _id: 'a' }, { _id: 'b' }]);
  await expect(
    expectJourneyDb({
      journey,
      params: { collection: 'items', match: { kind: 'x' }, count: 0 },
      timeout: 0,
    })
  ).rejects.toMatchObject({
    message: 'Expected 0 documents in "items" matching {"kind":"x"} but found 2.',
    expected: 0,
    actual: 2,
  });
});

test('expectJourneyDb matches equals item for item, each document holding the keys given', async () => {
  mockFindSessionDocuments.mockResolvedValue([{ _id: 'a', kind: 'x', at: 1 }]);
  await expectJourneyDb({
    journey,
    params: { collection: 'items', match: {}, equals: [{ kind: 'x' }] },
    timeout: 0,
  });
  await expect(
    expectJourneyDb({
      journey,
      params: { collection: 'items', match: {}, equals: [{ kind: 'y' }] },
      timeout: 0,
    })
  ).rejects.toThrow('Expected the documents in "items" matching {} to be [{"kind":"y"}]:');
});

test('expectJourneyDb needs a data set, and reports a connection it cannot read', async () => {
  await expect(
    expectJourneyDb({
      journey: { ...journey, dataSession: null },
      params: { collection: 'items', match: {}, count: 0 },
      timeout: 0,
    })
  ).rejects.toThrow(
    'expect.db reads the journey\'s data set database, and this journey declares no "data".'
  );
  mockFindSessionDocuments.mockRejectedValue(
    new Error('Connection "api" is not a MongoDBCollection.')
  );
  await expect(
    expectJourneyDb({
      journey,
      params: { collection: 'items', connectionId: 'api', match: {}, count: 0 },
      timeout: 0,
    })
  ).rejects.toThrow('Connection "api" is not a MongoDBCollection.');
});
