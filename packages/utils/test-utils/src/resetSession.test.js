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

import { beforeEach, expect, test, vi } from 'vitest';

const mockReloadDataSession = vi.fn(async () => {});
vi.doMock('./dataSets/reloadDataSession.js', () => ({ default: mockReloadDataSession }));

const { default: addFailGate } = await import('./dataSets/addFailGate.js');
const { default: resetSession } = await import('./resetSession.js');

let session;
let testSession;
beforeEach(() => {
  mockReloadDataSession.mockClear();
  session = {
    failGates: [],
    forced: [{ rid: 'rid-1', message: 'Down' }],
    pauseGates: [],
    stubs: [{ connectionType: 'AxiosHttp', requestType: 'AxiosHttp' }],
    sunk: [{ requestId: 'fetch_rate' }],
    work: new Set(),
  };
  testSession = {
    closed: false,
    dataSession: { session },
    dataSet: { name: 'stubs' },
    store: { client: {} },
  };
});

test('resetSession reloads the data set and empties sunk, the fail gates and forced failures, keeping stubs', async () => {
  addFailGate({ session, requestId: 'save_price', message: 'Down' });
  session.failGates[0].fired = 1;
  await resetSession({ testSession });
  expect(mockReloadDataSession).toHaveBeenCalledTimes(1);
  expect(session.sunk).toEqual([]);
  expect(session.failGates).toEqual([]);
  expect(session.forced).toEqual([]);
  expect(session.stubs).toHaveLength(1);
});

test('resetSession throws naming a fail gate that never fired, after resetting the session', async () => {
  addFailGate({ session, requestId: 'save_price', endpoint: 'price_run', message: 'Down' });
  addFailGate({ session, requestId: 'claim_run', message: 'Claim failed', times: 2 });
  session.failGates[1].fired = 1;
  addFailGate({ session, requestId: 'insert_activity', pageId: 'log', message: 'Log is down' });
  await expect(resetSession({ testSession })).rejects.toThrow(
    'session.reset(): the forced failure on request "save_price" on endpoint "price_run" ("Down"), the forced failure on request "insert_activity" on page "log" ("Log is down") never fired: no request the test made matched it, so nothing tested what it fails. The session was reset and the gate cleared.'
  );
  expect(mockReloadDataSession).toHaveBeenCalledTimes(1);
  expect(session.failGates).toEqual([]);
  await expect(resetSession({ testSession })).resolves.toBeUndefined();
});
