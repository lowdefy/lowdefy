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

import recordDetachedCalls from './recordDetachedCalls.js';

test('recordDetachedCalls records each detached call after the calls already there, in order', () => {
  const made = { kind: 'endpoint', endpointId: 'notify', status: 200 };
  const calls = [made];
  recordDetachedCalls({
    answer: {
      detached: [
        { endpointId: 'detached_log', payload: { source: 'notify' } },
        { endpointId: 'send_mail', payload: {} },
      ],
    },
    calls,
  });
  const unanswered = { status: null, success: null, response: null, error: null };
  expect(calls).toEqual([
    made,
    {
      kind: 'endpoint',
      endpointId: 'detached_log',
      detached: true,
      payload: { source: 'notify' },
      ...unanswered,
    },
    { kind: 'endpoint', endpointId: 'send_mail', detached: true, payload: {}, ...unanswered },
  ]);
});

test('recordDetachedCalls records nothing for an answer that made no detached call', () => {
  const calls = [];
  recordDetachedCalls({ answer: { detached: [] }, calls });
  expect(calls).toEqual([]);
});
