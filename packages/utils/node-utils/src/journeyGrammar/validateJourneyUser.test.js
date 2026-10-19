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

import validateJourneyUser from './validateJourneyUser.js';

test('validateJourneyUser accepts every single-value form', () => {
  expect(validateJourneyUser({})).toEqual({});
  expect(validateJourneyUser({ user: 'none' })).toEqual({});
  expect(validateJourneyUser({ user: 'member', data: 'crm' })).toEqual({});
  expect(validateJourneyUser({ user: { roles: ['admin'] } })).toEqual({});
});

test('validateJourneyUser accepts a list of distinct data set user names with data', () => {
  expect(validateJourneyUser({ user: ['admin', 'member'], data: 'crm' })).toEqual({});
  expect(validateJourneyUser({ user: ['admin'], data: 'crm' })).toEqual({});
});

test('validateJourneyUser refuses a list without data', () => {
  expect(validateJourneyUser({ user: ['admin', 'member'] }).error).toBe(
    'Journey "user" is a list of data set users, but the journey declares no "data": set "data" to the data set (tests/data/<name>.yaml) the users are in.'
  );
});

test('validateJourneyUser refuses an empty list', () => {
  expect(validateJourneyUser({ user: [], data: 'crm' }).error).toContain('empty list');
});

test('validateJourneyUser refuses none and inline objects inside a list', () => {
  expect(validateJourneyUser({ user: ['admin', 'none'], data: 'crm' }).error).toBe(
    'Journey "user" list should hold data set user names only; "none" and inline user objects stay single values. Received "none".'
  );
  expect(validateJourneyUser({ user: [{ roles: ['admin'] }], data: 'crm' }).error).toContain(
    'Received {"roles":["admin"]}.'
  );
  expect(validateJourneyUser({ user: ['', 'admin'], data: 'crm' }).error).toContain('Received "".');
});

test('validateJourneyUser refuses a name listed twice', () => {
  expect(validateJourneyUser({ user: ['admin', 'member', 'admin'], data: 'crm' }).error).toBe(
    'Journey "user" list names "admin" more than once.'
  );
});

test('validateJourneyUser refuses a value of another type', () => {
  expect(validateJourneyUser({ user: 3 }).error).toContain('Received 3.');
  expect(validateJourneyUser({ user: '' }).error).toContain('Journey "user" should be');
});
