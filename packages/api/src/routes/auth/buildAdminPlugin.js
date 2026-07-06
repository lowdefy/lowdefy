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

import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements, userAc } from 'better-auth/plugins/admin/access';
import { type } from '@lowdefy/helpers';

// The admin plugin is framework-controlled - it backs the admin steps and
// impersonation; its banned/banReason/banExpires fields land on the user
// record. When auth.userAdminRole is configured, the plugin registers a
// curated access control in which the user-admin role holds exactly the
// statements backing the shipped client actions - today user: ['impersonate'].
// The full admin statement set (set-password, set-email, ban, delete) is not
// granted, so those /api/auth/admin/* endpoints stay unreachable for the
// role, and impersonate-admins is deliberately excluded - a user-admin cannot
// impersonate another user-admin.
// The built-in "admin" and "user" roles keep their default statements: the
// plugin's roles option replaces rather than merges the defaults, and the
// admin steps inject acting sessions with role "admin" whose authority must
// hold. adminRoles extends to the user-admin role so impersonating a
// user-admin demands the excluded impersonate-admins statement.
function buildAdminPlugin({ authConfig }) {
  if (type.isNone(authConfig.userAdminRole)) {
    return admin();
  }
  const ac = createAccessControl(defaultStatements);
  return admin({
    ac,
    adminRoles: ['admin', authConfig.userAdminRole],
    roles: {
      admin: adminAc,
      user: userAc,
      [authConfig.userAdminRole]: ac.newRole({ user: ['impersonate'] }),
    },
  });
}

export default buildAdminPlugin;
