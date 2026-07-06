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

import buildAdminPlugin from './buildAdminPlugin.js';

test('buildAdminPlugin returns the default admin plugin when userAdminRole is not configured', () => {
  const plugin = buildAdminPlugin({ authConfig: {} });
  expect(plugin.id).toBe('admin');
  expect(plugin.options).toBeUndefined();
});

test('buildAdminPlugin grants the user-admin role exactly user impersonate', () => {
  const plugin = buildAdminPlugin({ authConfig: { userAdminRole: 'user-admin' } });
  expect(plugin.options.roles['user-admin'].statements).toEqual({ user: ['impersonate'] });
});

test('buildAdminPlugin user-admin role authorizes impersonate and nothing else', () => {
  const plugin = buildAdminPlugin({ authConfig: { userAdminRole: 'user-admin' } });
  const role = plugin.options.roles['user-admin'];
  expect(role.authorize({ user: ['impersonate'] }).success).toBe(true);
  // impersonate-admins is deliberately excluded - a user-admin cannot
  // impersonate another user-admin.
  expect(role.authorize({ user: ['impersonate-admins'] }).success).toBe(false);
  // The full admin statement set stays out of reach for the role, so the
  // matching /api/auth/admin/* endpoints stay unreachable.
  expect(role.authorize({ user: ['set-password'] }).success).toBe(false);
  expect(role.authorize({ user: ['set-email'] }).success).toBe(false);
  expect(role.authorize({ user: ['ban'] }).success).toBe(false);
  expect(role.authorize({ user: ['delete'] }).success).toBe(false);
  expect(role.authorize({ user: ['list'] }).success).toBe(false);
  expect(role.authorize({ session: ['revoke'] }).success).toBe(false);
});

test('buildAdminPlugin keeps the built-in admin role authority for injected acting sessions', () => {
  const plugin = buildAdminPlugin({ authConfig: { userAdminRole: 'user-admin' } });
  const adminRole = plugin.options.roles.admin;
  expect(adminRole.authorize({ user: ['ban'] }).success).toBe(true);
  expect(adminRole.authorize({ user: ['delete'] }).success).toBe(true);
  expect(adminRole.authorize({ user: ['list'] }).success).toBe(true);
  expect(adminRole.authorize({ session: ['revoke'] }).success).toBe(true);
});

test('buildAdminPlugin marks the user-admin role as an admin role for the impersonation target check', () => {
  const plugin = buildAdminPlugin({ authConfig: { userAdminRole: 'user-admin' } });
  expect(plugin.options.adminRoles).toEqual(['admin', 'user-admin']);
});
