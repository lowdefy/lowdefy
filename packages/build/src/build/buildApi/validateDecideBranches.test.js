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

import { jest } from '@jest/globals';

import buildApi from './buildApi.js';
import testContext from '../../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const logger = { warn: mockLogWarn };

beforeEach(() => {
  mockLogWarn.mockReset();
});

// Collected build errors (context.handleError), as messages.
function errorContext() {
  const context = testContext({ logger });
  context.errors = [];
  context.handleError = (error) => context.errors.push(error.message);
  return context;
}

// A fresh step per build: buildApi rewrites step ids in place.
const triage = () => ({
  id: 'triage',
  type: 'Decide',
  connectionId: 'gateway',
  properties: {
    model: 'typesafe-ai/jev',
    state: { _payload: 'ticket' },
    questions: {
      team: { choice: 'Which team handles this', options: { billing: 'Invoices', tech: 'Bugs' } },
      down: { yesno: 'The service is down' },
      urgency: { score: 'How urgent', levels: ['low', 'high'] },
    },
  },
});

function build(routineAfter) {
  const context = errorContext();
  buildApi({
    components: {
      api: [{ id: 'triage-ticket', type: 'Api', routine: [triage(), ...routineAfter] }],
    },
    context,
  });
  return context.errors;
}

test('validateDecideBranches accepts branches on real options, levels and fields', () => {
  const errors = build([
    {
      ':if': { _eq: [{ _step: 'triage.team.choice' }, 'billing'] },
      ':then': [{ ':return': { team: 'billing' } }],
    },
    {
      ':if': { _ne: ['high', { _step: 'triage.urgency.level' }] },
      ':then': [{ ':return': { confidence: { _step: 'triage.team.confidence' } } }],
    },
    { ':return': { down: { _step: 'triage.down.answer' }, usage: { _step: 'triage.usage' } } },
  ]);
  expect(errors).toEqual([]);
});

test('validateDecideBranches fails a branch on a name that is not an option', () => {
  const errors = build([
    {
      ':if': { _eq: [{ _step: 'triage.team.choice' }, 'bil-ling'] },
      ':then': [{ ':return': {} }],
    },
  ]);
  expect(errors).toEqual([
    '_eq in endpoint "triage-ticket" compares "triage.team.choice" with "bil-ling", which is not an option of question "team" (billing, tech). The branch could never match.',
  ]);
});

test('validateDecideBranches fails a branch on a level a score does not have', () => {
  const errors = build([
    {
      ':if': { _eq: ['critical', { _step: 'triage.urgency.level' }] },
      ':then': [{ ':return': {} }],
    },
  ]);
  expect(errors).toEqual([
    '_eq in endpoint "triage-ticket" compares "triage.urgency.level" with "critical", which is not a level of question "urgency" (low, high). The branch could never match.',
  ]);
});

test('validateDecideBranches fails a reference to a question the step does not ask', () => {
  const errors = build([{ ':return': { team: { _step: 'triage.teem.choice' } } }]);
  expect(errors).toEqual([
    '_step "triage.teem.choice" in endpoint "triage-ticket" names question "teem", but Decide step "triage" asks no such question. Its questions are: team, down, urgency.',
  ]);
});

test('validateDecideBranches fails a field the answer does not have', () => {
  const errors = build([{ ':return': { down: { _step: 'triage.down.choice' } } }]);
  expect(errors).toEqual([
    '_step "triage.down.choice" in endpoint "triage-ticket" reads "choice", but a yesno answer has only: answer, probability, confidence.',
  ]);
});

test('validateDecideBranches leaves questions built by an operator alone', () => {
  const context = errorContext();
  buildApi({
    components: {
      api: [
        {
          id: 'dynamic',
          type: 'Api',
          routine: [
            {
              ...triage(),
              properties: { ...triage().properties, questions: { _payload: 'questions' } },
            },
            {
              ':if': { _eq: [{ _step: 'triage.anything.choice' }, 'x'] },
              ':then': [{ ':return': {} }],
            },
          ],
        },
      ],
    },
    context,
  });
  expect(context.errors).toEqual([]);
});
