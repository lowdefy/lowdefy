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
  { requestId: 'save_price', fail: 'Write failed on purpose', times: 'all' },
];

test('validateJourneyStubs accepts no stubs, and a list of answers and forced failures with a data set', () => {
  expect(validateJourneyStubs({ data: undefined, stubs: undefined })).toBeUndefined();
  expect(validateJourneyStubs({ data: 'stubs', stubs })).toBeUndefined();
  expect(validateJourneyStubs({ data: 'stubs', stubs: [] })).toBeUndefined();
});

test('validateJourneyStubs refuses stubs with no data set', () => {
  expect(validateJourneyStubs({ data: undefined, stubs })).toEqual(
    '"stubs" need a data set: stubs and forced failures live on the journey\'s data session. Give the journey a "data".'
  );
});

test('validateJourneyStubs refuses a list that is not one, naming a bad entry by its place', () => {
  expect(validateJourneyStubs({ data: 'stubs', stubs: { fail: 'x' } })).toEqual(
    '"stubs" should be a list of answer stubs and forced failures. Received {"fail":"x"}.'
  );
  expect(
    validateJourneyStubs({ data: 'stubs', stubs: [stubs[0], { requestId: 'save', fail: '' }] })
  ).toEqual('"stubs[1]": Journey stub "fail" should be a non-empty string. Received "".');
});

test('validateJourneyStubs refuses a _ref, which only a journey file read by lowdefy test takes', () => {
  expect(
    validateJourneyStubs({ data: 'stubs', stubs: [{ _ref: 'tests/shared/stubs/rates.yaml' }] })
  ).toEqual(
    '"stubs[0]" is a _ref. Stubs are sent as literal values: a journey file that refers to shared stubs runs through lowdefy test (lowdefy_run_tests), which reads its _ref.'
  );
});
