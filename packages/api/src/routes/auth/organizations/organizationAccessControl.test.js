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

import { roles, statements } from './organizationAccessControl.js';

test('organizationAccessControl extends the member statement with list', () => {
  expect(statements.member).toEqual(expect.arrayContaining(['create', 'update', 'delete', 'list']));
});

test('organizationAccessControl adds the user and session resources', () => {
  expect(statements.user).toEqual(['ban', 'delete', 'set-attributes', 'update']);
  expect(statements.session).toEqual(['revoke']);
});

test('organizationAccessControl registers exactly the three built-in roles', () => {
  expect(Object.keys(roles)).toEqual(['owner', 'admin', 'member']);
});

test('organizationAccessControl grants the added user actions to owner and admin', () => {
  expect(roles.owner.authorize({ user: ['ban'] }).success).toBe(true);
  expect(roles.admin.authorize({ user: ['ban'] }).success).toBe(true);
});

test('organizationAccessControl grants the added session action to owner and admin', () => {
  expect(roles.owner.authorize({ session: ['revoke'] }).success).toBe(true);
  expect(roles.admin.authorize({ session: ['revoke'] }).success).toBe(true);
});

test('organizationAccessControl grants member none of the added actions', () => {
  expect(roles.member.authorize({ user: ['ban'] }).success).not.toBe(true);
  expect(roles.member.authorize({ member: ['list'] }).success).not.toBe(true);
  expect(roles.member.authorize({ session: ['revoke'] }).success).not.toBe(true);
});

test('organizationAccessControl keeps organization delete as the one statement owner holds beyond admin', () => {
  expect(roles.owner.authorize({ organization: ['delete'] }).success).toBe(true);
  expect(roles.admin.authorize({ organization: ['delete'] }).success).not.toBe(true);
  expect(roles.admin.authorize({ organization: ['update'] }).success).toBe(true);
});

test('organizationAccessControl keeps the inert ac read statement on member', () => {
  expect(roles.member.statements.ac).toEqual(['read']);
});
