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

import { APIError } from 'better-auth/api';

import ensureOrganization from './ensureOrganization.js';
import findPendingInvitation from './findPendingInvitation.js';

// The engine-tier session.create hook that applies the active-org policy.
// session.create is the one provider-agnostic choke point - it fires for
// email/password, magic link and OAuth alike.
//
// pinned: a member of the pinned org gets it as the active organization; a
// non-member with a pending, unexpired invitation is admitted far enough to
// accept (the membership wall in resolveAuthentication still gates every
// protected page until then); anyone else is rejected before a session is
// minted, with a distinct error code the client surfaces inline.
//
// tenant: the active org is the user's business - the oldest membership when
// they hold several; a user with a pending invitation gets a session but no
// org (they proceed to accept); a fresh signup mints its own organization
// lazily, as owner, through the plugin's createOrganization so its
// invariants and hooks run.
function createActiveOrgPolicyHook({ getAuth, organizations }) {
  async function applyPinnedPolicy({ auth, adapter, internalAdapter, session }) {
    const organization = await ensureOrganization({ auth, slug: organizations.org });
    const member = await adapter.findOne({
      model: 'member',
      where: [
        { field: 'userId', value: session.userId },
        { field: 'organizationId', value: organization.id },
      ],
    });
    if (member) {
      return { data: { ...session, activeOrganizationId: organization.id } };
    }
    const user = await internalAdapter.findUserById(session.userId);
    const invitation = user
      ? await findPendingInvitation({
          adapter,
          email: user.email,
          organizationId: organization.id,
        })
      : null;
    if (invitation) {
      // The pending-invitation carve-out: the invitee needs a session to
      // accept, so the session is created without an active organization.
      return;
    }
    throw new APIError('FORBIDDEN', {
      message: 'You have not been granted access to this application.',
      code: 'MEMBERSHIP_REQUIRED',
    });
  }

  async function applyTenantPolicy({ auth, adapter, internalAdapter, session }) {
    const members = await adapter.findMany({
      model: 'member',
      where: [{ field: 'userId', value: session.userId }],
      sortBy: { field: 'createdAt', direction: 'asc' },
      limit: 1,
    });
    if (members.length > 0) {
      return { data: { ...session, activeOrganizationId: members[0].organizationId } };
    }
    const user = await internalAdapter.findUserById(session.userId);
    const invitation = user
      ? await findPendingInvitation({ adapter, email: user.email })
      : null;
    if (invitation) {
      // An invited user joins the inviter's tenant on accept - mint nothing.
      // If the invitation expires unaccepted, the next login lands here with
      // no pending invitation and mints their own tenant.
      return;
    }
    const organization = await auth.api.createOrganization({
      body: {
        name: user?.name || user?.email || session.userId,
        slug: `org-${session.userId}`,
        userId: session.userId,
      },
    });
    return { data: { ...session, activeOrganizationId: organization.id } };
  }

  return async function activeOrgPolicyHook(session) {
    const auth = getAuth();
    const { adapter, internalAdapter } = await auth.$context;
    if (organizations.policy === 'tenant') {
      return applyTenantPolicy({ auth, adapter, internalAdapter, session });
    }
    return applyPinnedPolicy({ auth, adapter, internalAdapter, session });
  };
}

export default createActiveOrgPolicyHook;
