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

import { expect } from 'vitest';

// jest compared two errors by their message alone. vitest also compares their class and every
// enumerable property, such as the `handled` flag a routine sets on an error it has logged. The
// routine suites assert errors by message, as they did under jest.
function errorMessageEquality(a, b) {
  if (a instanceof Error && b instanceof Error) {
    return a.message === b.message;
  }
  return undefined;
}

expect.addEqualityTesters([errorMessageEquality]);
