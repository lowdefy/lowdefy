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

import findJourneyPlaceholder from './findJourneyPlaceholder.js';

test('findJourneyPlaceholder accepts a journey of literal values', () => {
  expect(
    findJourneyPlaceholder({
      journey: {
        data: 'scope',
        user: 'client_a',
        steps: [
          {
            call: {
              endpoint: 'tickets-add-comment',
              payload: { ticket_id: 'T-B-1', at: { _date: 'now' } },
            },
          },
          { expect: { status: 400 } },
        ],
        stubs: [{ requestId: 'save', fail: 'Down' }],
      },
    })
  ).toEqual({});
});

test('findJourneyPlaceholder names a _case left in a journey by its path', () => {
  expect(
    findJourneyPlaceholder({
      journey: {
        steps: [
          { call: { endpoint: 'tickets-add-comment' } },
          {
            call: { endpoint: 'tickets-add-comment', payload: { ticket_id: { _case: 'ticket' } } },
          },
        ],
      },
    })
  ).toEqual({
    error:
      'Journey "steps[1].call.payload.ticket_id" is a _case placeholder, {"_case":"ticket"}, with no case row to fill it in: _case reads a key of a row of the journey\'s "cases" table.',
  });
  expect(findJourneyPlaceholder({ journey: { user: { _case: 'user' } } })).toEqual({
    error:
      'Journey "user" is a _case placeholder, {"_case":"user"}, with no case row to fill it in: _case reads a key of a row of the journey\'s "cases" table.',
  });
});

test('findJourneyPlaceholder names a _ref left in a journey by its path', () => {
  expect(
    findJourneyPlaceholder({
      journey: { stubs: [{ _ref: 'tests/shared/stubs/rates.yaml' }], steps: [] },
    })
  ).toEqual({
    error:
      'Journey "stubs[0]" is a _ref, {"_ref":"tests/shared/stubs/rates.yaml"}, that was not read: _ref is resolved only when lowdefy test reads a journey file.',
  });
});
