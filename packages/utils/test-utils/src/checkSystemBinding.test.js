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

import checkSystemBinding from './checkSystemBinding.js';

test('checkSystemBinding accepts no binding, an organization, and an organization with a caller', () => {
  expect(() => checkSystemBinding({})).not.toThrow();
  expect(() => checkSystemBinding({ organization: 'org_a' })).not.toThrow();
  expect(() =>
    checkSystemBinding({ organization: 'org_a', caller: { id: 'job', name: 'Nightly job' } })
  ).not.toThrow();
});

test('checkSystemBinding refuses a caller without an organization', () => {
  expect(() => checkSystemBinding({ caller: { id: 'job', name: 'Nightly job' } })).toThrow(
    'system() names a "caller" without an "organization". A stand-in caller only runs inside an organization binding.'
  );
});

test('checkSystemBinding refuses an organization that is not a non-empty string', () => {
  expect(() => checkSystemBinding({ organization: '' })).toThrow(
    'system() requires "organization" to be a non-empty organization id string. Received "".'
  );
});

test('checkSystemBinding refuses a caller without an id and name', () => {
  expect(() => checkSystemBinding({ organization: 'org_a', caller: { id: 'job' } })).toThrow(
    'system() requires "caller" to be an object with non-empty string "id" and "name". Received {"id":"job"}.'
  );
});
