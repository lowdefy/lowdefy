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

test('findJourneyPlaceholder with literal passes a _ref or _case inside a value through as data', () => {
  expect(
    findJourneyPlaceholder({
      literal: true,
      journey: {
        data: 'scope',
        user: 'client_a',
        steps: [
          { call: { endpoint: 'save_config', payload: { _ref: 'x' } } },
          { call: { endpoint: 'save_config', payload: { rule: { _case: 'kind' } } } },
          { expect: { calls: { endpoint: 'save_config', match: { payload: { _ref: 'x' } } } } },
        ],
        stubs: [{ requestId: 'load', answer: { _ref: 'x' } }],
      },
    })
  ).toEqual({});
});

test('findJourneyPlaceholder with literal refuses a _ref or _case where a file meant a part of the journey', () => {
  const refused = (journey) => findJourneyPlaceholder({ journey, literal: true }).error;
  expect(refused({ steps: [{ call: { endpoint: 'a' } }, { _ref: 'tests/shared/x.yaml' }] })).toBe(
    'Journey "steps[1]" is a _ref, {"_ref":"tests/shared/x.yaml"}, that was not read: _ref is resolved only when lowdefy test reads a journey file.'
  );
  expect(refused({ steps: { _ref: 'tests/shared/steps.yaml' } })).toMatch(
    /^Journey "steps" is a _ref/
  );
  expect(refused({ cases: { _ref: 'tests/shared/cases.yaml' }, steps: [] })).toMatch(
    /^Journey "cases" is a _ref/
  );
  expect(refused({ stubs: { _ref: 'tests/shared/stubs.yaml' }, steps: [] })).toMatch(
    /^Journey "stubs" is a _ref/
  );
  expect(refused({ stubs: [{ _ref: 'tests/shared/stub.yaml' }], steps: [] })).toMatch(
    /^Journey "stubs\[0\]" is a _ref/
  );
  expect(refused({ user: { _case: 'user' }, steps: [] })).toMatch(
    /^Journey "user" is a _case placeholder/
  );
  expect(refused({ user: ['a', { _case: 'user' }], steps: [] })).toMatch(
    /^Journey "user\[1\]" is a _case placeholder/
  );
  expect(refused({ data: { _case: 'data' }, steps: [] })).toMatch(
    /^Journey "data" is a _case placeholder/
  );
  expect(refused({ pageId: { _case: 'page' }, steps: [] })).toMatch(
    /^Journey "pageId" is a _case placeholder/
  );
  expect(refused({ steps: [{ _case: 'step' }] })).toMatch(
    /^Journey "steps\[0\]" is a _case placeholder/
  );
});
