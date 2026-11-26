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

import expectAnswerError from './expectAnswerError.js';

const refused = { description: 'endpoint "auditor_only"', status: 403, error: 'Not allowed.' };

test('expectAnswerError passes on an error containing the text, and fails on another or none', () => {
  expect(() => expectAnswerError({ answer: refused, text: 'allowed' })).not.toThrow();
  expect(() => expectAnswerError({ answer: refused, text: 'missing' })).toThrow(
    'Expected endpoint "auditor_only" to answer with an error containing "missing" but its error was "Not allowed.".'
  );
  const ok = { description: 'endpoint "log"', status: 200, error: null };
  expect(() => expectAnswerError({ answer: ok, text: 'x' })).toThrow(
    'Expected endpoint "log" to answer with an error containing "x" but it answered 200 with no error.'
  );
});

test('expectAnswerError adds the hint the answer carries to its failure', () => {
  const answer = { ...refused, hint: 'Name the organization.' };
  expect(() => expectAnswerError({ answer, text: 'missing' })).toThrow(
    'Expected endpoint "auditor_only" to answer with an error containing "missing" but its error was "Not allowed.". Name the organization.'
  );
});
