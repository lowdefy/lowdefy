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

import ensureOrganization from './ensureOrganization.js';

// The engine-tier user.create.after hook for open signup under the pinned
// policy: auto-join the pinned org with the plugin's built-in "member" role,
// through the server-only addMember endpoint so the plugin's invariants and
// hooks run. The role carries no page grants - the user passes the
// membership wall while role-gated pages still gate them. With
// requireEmailVerification the signup holds this member row but obtains no
// session until verified, so joining at user-create is safe.
function createAutoJoinHook({ getAuth, organizations }) {
  return async function autoJoinHook(user) {
    const auth = getAuth();
    const organization = await ensureOrganization({ auth, slug: organizations.org });
    await auth.api.addMember({
      body: {
        userId: user.id,
        organizationId: organization.id,
        role: 'member',
      },
    });
  };
}

export default createAutoJoinHook;
