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

import checkCharterRoles from './checkCharterRoles.js';

const dataSet = { users: { admin_ann: { roles: ['admin'] }, member_max: { roles: [] } } };

test('checkCharterRoles passes data set users, and charters that name no roles', () => {
  expect(() =>
    checkCharterRoles({
      charters: [{ goal: 'a', roles: ['admin_ann', 'member_max'] }, { goal: 'b' }],
      dataSet,
    })
  ).not.toThrow();
  expect(() => checkCharterRoles({ charters: [{ goal: 'b' }], dataSet: null })).not.toThrow();
});

test('checkCharterRoles refuses an unknown role, and roles with no data set, naming the charter', () => {
  expect(() =>
    checkCharterRoles({
      charters: [{ goal: 'a' }, { goal: 'b' }, { goal: 'Try edge input.', roles: ['admin'] }],
      dataSet,
    })
  ).toThrow(
    'Charter 3 ("Try edge input.") names role "admin", which is not a user in the data set.'
  );
  expect(() =>
    checkCharterRoles({ charters: [{ goal: 'a', roles: ['admin_ann'] }], dataSet: null })
  ).toThrow(
    'Charter 1 ("a") names roles, which are data set users, but no data set resolved. Name one with --data.'
  );
});
