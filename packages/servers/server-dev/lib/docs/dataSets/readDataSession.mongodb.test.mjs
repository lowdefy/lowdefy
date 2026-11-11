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

import { vi, afterAll, beforeAll, expect, test } from 'vitest';
import { getDataStore, openDataSession } from '@lowdefy/test-utils/dataSets';

import readDataSession from './readDataSession.js';
import { journeyActorToken } from '../../server/auth/journeyActor.js';

// The one test of a real data session that reads it back through the dev server's journey cookie.
// The rest of the data session suite is in @lowdefy/test-utils, beside openDataSession.

const mockLogger = { info: vi.fn(), warn: vi.fn() };

vi.setConfig({ testTimeout: 120000, hookTimeout: 120000 });

let store;

beforeAll(async () => {
  store = await getDataStore({ logger: mockLogger });
});

afterAll(async () => {
  await store.stop();
});

function makeDataSet(overrides) {
  return {
    name: 'sample',
    fixtures: {},
    generated: {},
    indexes: {},
    users: {},
    collections: {},
    ...overrides,
  };
}

function cookieFor(id) {
  return `lowdefy_journey_data=${journeyActorToken}.${id}`;
}

test('readDataSession returns the open session, and { ended } once it closes', async () => {
  const { id, cookie, session, close } = await openDataSession({
    dataSet: makeDataSet({}),
    logger: mockLogger,
  });
  expect(cookie).toEqual(id);
  expect(readDataSession(cookieFor(id))).toBe(session);
  await close();
  expect(readDataSession(cookieFor(id))).toEqual({ ended: id });
});
