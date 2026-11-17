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

import findErrorEntries from './findErrorEntries.js';

test("findErrorEntries finds client and server errors, and no finding for a test's forced failure", () => {
  expect(
    findErrorEntries({
      clientEntries: [{ name: 'TypeError', message: 'x is undefined' }],
      serverEntries: [
        { name: 'ConfigError', message: 'Bad config.', source: 'api/a.yaml:3' },
        { name: 'ServiceError', message: 'Write failed on purpose', forced: true },
      ],
    })
  ).toEqual([
    { kind: 'client-error', message: 'x is undefined', source: null },
    { kind: 'server-error', message: 'Bad config.', source: 'api/a.yaml:3' },
  ]);
});
