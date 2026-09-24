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

// The admin plugin is registered for two things: it owns the
// banned/banReason/banExpires fields on the user row, and it owns the endpoints
// the BanUser, UnbanUser, DeleteUser and RevokeUserSessions steps call. Those
// calls carry server authority - callPluginEndpoint injects an acting user with
// role: 'admin', which the vendor's built-in admin role satisfies - and the
// step floor is what authorizes them, per organization and bounded by the
// target's membership there.
//
// So the vendor's default roles are all this needs. Nothing in Lowdefy writes
// user.role, so no real browser session holds a role in adminRoles and no
// browser caller can satisfy any /admin/* check; the whole surface is disabled
// at the router besides (see ADMIN_PATHS_DISABLED in getBetterAuthConfig).
// A custom access control would only exist to grant a real user authority the
// platform has none to grant.
function buildAdminPlugin() {
  return admin();
}

export default buildAdminPlugin;
