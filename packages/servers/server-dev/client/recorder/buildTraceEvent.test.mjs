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

import buildTraceEvent from './buildTraceEvent.js';

function payload({ responses, requests = {}, apiResponses = {} }) {
  return {
    eventName: 'onClick',
    blockId: 'save',
    success: true,
    failure: null,
    stateBefore: { a: 1 },
    record: { responses },
    context: { state: { a: 1 }, requests, _internal: { lowdefy: { apiResponses } } },
  };
}

test('buildTraceEvent lists the actions the event ran, in order, without skipped ones', () => {
  const event = buildTraceEvent({
    payload: payload({
      responses: {
        link: { type: 'Link', index: 2 },
        validate: { type: 'Validate', index: 0 },
        skipped: { type: 'SetState', index: 1, skipped: true },
      },
    }),
  });
  expect(event.actions).toEqual(['Validate', 'Link']);
});

test('buildTraceEvent names the endpoints its CallAPI actions called', () => {
  const event = buildTraceEvent({
    payload: payload({
      responses: { call: { type: 'CallAPI', index: 0 } },
      apiResponses: {
        syncInvoices: [{ actionId: 'call', success: true, responseTime: 30 }],
        failedElsewhere: [{ actionId: 'other', success: false, responseTime: 5 }],
        refused: [{ actionId: 'call', success: false }],
      },
    }),
  });
  expect(event.endpoints).toEqual([
    { id: 'syncInvoices', ok: true, ms: 30 },
    { id: 'refused', ok: false, ms: null },
  ]);
});
