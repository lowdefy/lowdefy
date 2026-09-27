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

import validateJourneyTimeout from './validateJourneyTimeout.js';

test.each([undefined, 1, 5000, 60000])('validateJourneyTimeout accepts %j', (timeout) => {
  expect(validateJourneyTimeout({ timeout })).toBeUndefined();
});

test.each([0, -1, 60001, 1500.5, '5000', null])('validateJourneyTimeout rejects %j', (timeout) => {
  expect(validateJourneyTimeout({ timeout })).toEqual(
    `The journey "timeout" must be a whole number of milliseconds from 1 to 60000. Received ${JSON.stringify(
      timeout
    )}.`
  );
});
