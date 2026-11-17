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

import { expect, test } from 'vitest';

import addFailGate from './dataSets/addFailGate.js';
import unfiredFailGates from './unfiredFailGates.js';

test('unfiredFailGates lists the fail gates no request has reached', () => {
  const session = { failGates: [] };
  const testSession = { closed: false, dataSession: { session } };
  addFailGate({ session, requestId: 'save_price', endpoint: 'price_run', message: 'Down' });
  addFailGate({ session, requestId: 'claim_run', message: 'Claim failed', times: 2 });
  session.failGates[1].fired = 1;
  expect(unfiredFailGates({ testSession })).toEqual([
    {
      requestId: 'save_price',
      endpoint: 'price_run',
      pageId: undefined,
      message: 'Down',
      times: 1,
    },
  ]);
});

test('unfiredFailGates refuses a closed session', () => {
  const testSession = { closed: true, dataSession: { session: { failGates: [] } } };
  expect(() => unfiredFailGates({ testSession })).toThrow('The session is closed');
});
