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

import validateJourneyStubs from './validateJourneyStubs.js';

const stubs = [
  { connectionType: 'AxiosHttp', requestType: 'AxiosHttp', answer: { rate: 1.5 } },
  { requestId: 'save_price', endpoint: 'price_run', fail: 'Write failed on purpose', times: 2 },
];

test('validateJourneyStubs accepts no stubs, and a list of answers and forced failures', () => {
  expect(validateJourneyStubs({ stubs: undefined })).toEqual({});
  expect(validateJourneyStubs({ stubs })).toEqual({});
  expect(validateJourneyStubs({ stubs: [] })).toEqual({});
});

test('validateJourneyStubs refuses stubs that are not a list', () => {
  expect(validateJourneyStubs({ stubs: { fail: 'x' } })).toEqual({
    error:
      'Journey "stubs" should be a list of answer stubs and forced failures. Received {"fail":"x"}.',
  });
});

test('validateJourneyStubs names a bad entry by its place', () => {
  expect(validateJourneyStubs({ stubs: [stubs[0], { requestId: 'save', fail: '' }] })).toEqual({
    error: 'Journey "stubs[1]": Journey stub "fail" should be a non-empty string. Received "".',
  });
});
