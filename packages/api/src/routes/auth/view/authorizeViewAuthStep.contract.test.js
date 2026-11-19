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

// The view rule for auth steps names step types (authorizeViewAuthStep), and
// the steps live in another package. This holds the two together: every step
// the auth plugin ships is placed here on purpose, so a step added there fails
// this test until someone decides whether a view session may run it.

import { expect, test } from 'vitest';
import * as steps from '@lowdefy/plugin-better-auth/steps';

import { CREDENTIAL_STEPS, READ_STEPS } from './authorizeViewAuthStep.js';

const reads = ['ListMembers', 'ListUsers'];
const credentials = ['CreateMcpToken'];
const writes = [
  'BanUser',
  'CancelInvitation',
  'CreateOrganization',
  'DeleteUser',
  'InviteMember',
  'LeaveOrganization',
  'RemoveMember',
  'ResetUserTwoFactor',
  'RevokeMcpGrant',
  'RevokeMcpToken',
  'RevokeOrgMcpToken',
  'RevokeUserPasskeys',
  'RevokeUserSessions',
  'SuspendMember',
  'UnbanUser',
  'UnsuspendMember',
  'UpdateMemberAttributes',
  'UpdateMemberOrgRole',
  'UpdateMemberRoles',
  'UpdateOrganization',
  'UpdateUserAttributes',
  'UpdateUserProfile',
];

test('every auth step the plugin ships is placed as a read, a write or a credential step', () => {
  expect(Object.keys(steps).sort()).toEqual([...reads, ...credentials, ...writes].sort());
});

test('the read and credential lists name exactly the steps placed as such', () => {
  expect([...READ_STEPS].sort()).toEqual(reads);
  expect([...CREDENTIAL_STEPS].sort()).toEqual(credentials);
});
