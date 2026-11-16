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

import { AssertionError } from 'node:assert';
import { inspect } from 'node:util';

import describeExpected from './describeExpected.js';
import formatPath from './formatPath.js';

function show(value) {
  return inspect(value, { depth: 6, breakLength: 100 });
}

// Fails the test with the first difference: where it is, what was there and what was expected.
// The error carries the whole actual and expected values, which test runners print as a diff.
function throwDifference({ actual, assertion, expected, found, message }) {
  const where = found.path.length === 0 ? 'The value' : formatPath(found.path);
  const lines = [
    message,
    `${where} ${found.reason}.`,
    `  actual:   ${show(found.actual)}`,
    `  expected: ${show(describeExpected(found.expected))}`,
  ].filter((line) => line !== undefined);
  throw new AssertionError({
    actual,
    expected: describeExpected(expected),
    message: lines.join('\n'),
    operator: assertion.name,
    stackStartFn: assertion,
  });
}

export default throwDifference;
