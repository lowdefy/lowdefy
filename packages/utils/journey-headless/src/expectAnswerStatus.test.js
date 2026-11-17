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

import expectAnswerStatus from './expectAnswerStatus.js';

const refused = { description: 'endpoint "auditor_only"', status: 403, error: 'Not allowed.' };

test('expectAnswerStatus passes on the status the answer has, and names its error when it differs', () => {
  expect(() => expectAnswerStatus({ answer: refused, status: 403 })).not.toThrow();
  expect(() => expectAnswerStatus({ answer: refused, status: 200 })).toThrow(
    'Expected endpoint "auditor_only" to answer 200 but it answered 403: Not allowed.'
  );
});
