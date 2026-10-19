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

import { roles } from './organizationAccessControl.js';

// Asks the organization plugin's own access control whether a stored member.role
// satisfies a permission set. hasPermission is not exported by better-auth, so
// this mirrors hasPermissionFn (dist/plugins/organization/permission.mjs)
// exactly: split the CSV, pass if ANY role authorizes. The creator
// short-circuit is deliberately not mirrored - hasPermissionFn only takes it
// when allowCreatorAllPermissions is passed, which happens at exactly one
// endpoint, and this is not that endpoint.
function authorizeRole({ permissions, role }) {
  const names = String(role ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return names.some((name) => roles[name]?.authorize(permissions)?.success === true);
}

export default authorizeRole;
