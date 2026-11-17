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

import validateJourneyDataSession from './validateJourneyDataSession.js';

const stubs = [{ requestId: 'save_price', fail: 'Write failed on purpose' }];

test('validateJourneyDataSession accepts stubs, hold, release and expect.sunk with a data set', () => {
  expect(
    validateJourneyDataSession({
      data: 'races',
      stubs,
      steps: [
        { hold: { requestId: 'claim_run' } },
        { release: 'claim_run' },
        { expect: { sunk: { count: 0 } } },
      ],
    })
  ).toEqual({});
});

test('validateJourneyDataSession accepts a journey with no data set that needs no data session', () => {
  expect(
    validateJourneyDataSession({
      steps: [{ call: { endpoint: 'ping' } }, { expect: { status: 200 } }, { wait: 100 }],
    })
  ).toEqual({});
});

test('validateJourneyDataSession refuses stubs with no data set', () => {
  expect(validateJourneyDataSession({ stubs, steps: [] })).toEqual({
    error:
      'Journey "stubs" need a data set: stubs and forced failures live on the journey\'s data session. Give the journey a "data".',
  });
});

test('validateJourneyDataSession refuses hold and release with no data set, naming the step', () => {
  expect(
    validateJourneyDataSession({
      steps: [{ call: { endpoint: 'ping' } }, { hold: { requestId: 'claim_run' } }],
    })
  ).toEqual({
    error:
      'Step 1: "hold" needs a data set: its gate lives on the journey\'s data session. Give the journey a "data".',
  });
  expect(validateJourneyDataSession({ data: null, steps: [{ release: 'claim_run' }] })).toEqual({
    error:
      'Step 0: "release" needs a data set: its gate lives on the journey\'s data session. Give the journey a "data".',
  });
});

test('validateJourneyDataSession refuses expect.sunk with no data set', () => {
  expect(validateJourneyDataSession({ steps: [{ expect: { sunk: { count: 0 } } }] })).toEqual({
    error:
      'Step 0: expect.sunk needs a data set: it reads the requests the journey\'s data session recorded. Give the journey a "data".',
  });
});

test('validateJourneyDataSession accepts an empty stubs list with no data set', () => {
  expect(validateJourneyDataSession({ stubs: [], steps: [] })).toEqual({});
});
