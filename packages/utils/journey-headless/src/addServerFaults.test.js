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

import addServerFaults from './addServerFaults.js';
import createErrorSink from './createErrorSink.js';

const call = { endpointId: 'notify', kind: 'endpoint' };

test('addServerFaults adds a fault that escaped the routine to the error sink, with its call', () => {
  const errorSink = createErrorSink();
  const fault = new Error('Connection "ledger" does not exist.');
  addServerFaults({ call, errorSink, faults: [fault] });
  expect(errorSink.errors).toEqual([{ call, error: fault, source: 'server' }]);
});

test('addServerFaults leaves out a fault a :catch of the routine handled', () => {
  const errorSink = createErrorSink();
  const caught = new Error('Auth step "invite" requires the auth engine.');
  caught.caught = true;
  addServerFaults({ call, errorSink, faults: [caught] });
  expect(errorSink.errors).toEqual([]);
});

test('addServerFaults adds the escaped fault of a call that also has a caught one', () => {
  const errorSink = createErrorSink();
  const caught = new Error('Connection "ledger" does not exist.');
  caught.caught = true;
  const escaped = new Error('Operator "_stat" is not defined.');
  addServerFaults({ call, errorSink, faults: [caught, escaped] });
  expect(errorSink.errors.map(({ error }) => error)).toEqual([escaped]);
});
