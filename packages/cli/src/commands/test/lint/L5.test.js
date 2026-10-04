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

import L5 from './L5.js';

function journey(extra = {}) {
  return { name: 'assigns a ticket', pageId: 'tickets', steps: [], ...extra };
}

const dataSet = { name: 'tickets', users: { member: { roles: ['member'] }, owner: {} } };

test('L5 passes a data set user name and user: none', () => {
  expect(L5({ journey: journey({ data: 'tickets', user: 'member' }), dataSet })).toEqual([]);
  expect(L5({ journey: journey({ user: 'none' }), dataSet: null })).toEqual([]);
});

test('L5 warns on an inline user object and on no user', () => {
  expect(L5({ journey: journey({ user: { roles: ['member'] } }), dataSet: null })).toEqual([
    {
      severity: 'warning',
      message:
        'has an inline user object: add the user to its data set (tests/data/<name>.yaml) and name it.',
    },
  ]);
  expect(L5({ journey: journey(), dataSet: null })).toEqual([
    {
      severity: 'warning',
      message: 'has no user: name a user from its data set, or write user: none for signed out.',
    },
  ]);
});

test('L5 warns on a user name the data set does not have, listing its users', () => {
  expect(L5({ journey: journey({ data: 'tickets', user: 'admin' }), dataSet })).toEqual([
    {
      severity: 'warning',
      message:
        'names user "admin", which data set "tickets" does not have. Its users: member, owner.',
    },
  ]);
});

test('L5 warns on a user name with no data set, and leaves an unreadable data set to lintJourneys', () => {
  expect(L5({ journey: journey({ user: 'member' }), dataSet: null })[0].message).toBe(
    'names user "member" but declares no data: set to find it in.'
  );
  expect(L5({ journey: journey({ data: 'missing', user: 'member' }), dataSet: null })).toEqual([]);
});
