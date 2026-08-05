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
import getHookRequestHeaders from './getHookRequestHeaders.js';

// The engine-tier user.create.after hook for open signup under the pinned
// policy: auto-join the pinned org through the server-only addMember endpoint
// so the plugin's invariants and hooks run. The member row is minted with the
// no-authority org tier 'member' and no appRoles, so the user passes the
// membership wall by row existence while role-gated pages still gate them -
// _user.roles reads [] because _user.roles is member.appRoles, not because
// the org tier is empty. With requireEmailVerification the signup holds this
// member row but obtains no session until verified, so joining at user-create
// is safe.
//
// BetterAuth flushes after-hooks at the end of the request (confirmed at
// 1.6.23), so a signup minting an immediate session runs the session.create
// policy hook first - that hook also ensures membership under open signup,
// and this one skips when the member row already exists. Both sites therefore
// have to agree on the value they mint, and createActiveOrgPolicyHook already
// writes 'member'.
function createAutoJoinHook({ getAuth, organizations }) {
  return async function autoJoinHook(user, ctx) {
    const auth = getAuth();
    const organization = await ensureOrganization({ auth, slug: organizations.org });
    const { adapter } = await auth.$context;
    const member = await adapter.findOne({
      model: 'member',
      where: [
        { field: 'userId', value: user.id },
        { field: 'organizationId', value: organization.id },
      ],
    });
    if (member) {
      return;
    }
    await auth.api.addMember({
      body: {
        userId: user.id,
        organizationId: organization.id,
        role: 'member',
      },
      headers: getHookRequestHeaders(ctx),
    });
  };
}

export default createAutoJoinHook;
