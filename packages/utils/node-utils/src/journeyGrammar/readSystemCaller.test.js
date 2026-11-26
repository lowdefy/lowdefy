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

import readSystemCaller from './readSystemCaller.js';

test('readSystemCaller reads "system" as the system bound to no organization', () => {
  expect(readSystemCaller('system')).toEqual({ organization: null, caller: null });
});

test('readSystemCaller reads the organization and stand-in caller of the object form', () => {
  expect(
    readSystemCaller({
      system: { organization: 'org_a', caller: { id: 'job', name: 'Nightly job' } },
    })
  ).toEqual({ organization: 'org_a', caller: { id: 'job', name: 'Nightly job' } });
  expect(readSystemCaller({ system: { organization: 'org_a' } })).toEqual({
    organization: 'org_a',
    caller: null,
  });
});

test('readSystemCaller answers null for a person', () => {
  expect(readSystemCaller(undefined)).toBeNull();
  expect(readSystemCaller('none')).toBeNull();
  expect(readSystemCaller('operator')).toBeNull();
  expect(readSystemCaller({ id: 'u_1', roles: ['admin'] })).toBeNull();
});
