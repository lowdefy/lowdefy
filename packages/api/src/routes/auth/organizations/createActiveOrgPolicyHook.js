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
import { getOrgAdapter } from 'better-auth/plugins';

import ensureOrganization from './ensureOrganization.js';
import findPendingInvitation from './findPendingInvitation.js';
import getHookRequestHeaders from './getHookRequestHeaders.js';
import isEmailAdmitted from './isEmailAdmitted.js';

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
// org (they proceed to accept); a fresh signup under create: auto mints its
// own organization lazily, as owner, through the org plugin's adapter layer
// (the endpoint cannot serve the mint - see applyTenantPolicy).
function createActiveOrgPolicyHook({ getAuth, logger, organizations }) {
  async function applyPinnedPolicy({ auth, adapter, internalAdapter, session, ctx }) {
    const organization = await ensureOrganization({ auth, logger, slug: organizations.org });
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
    // Open signup ensures membership here as well as at user.create.after:
    // BetterAuth queues after-hooks inside an endpoint's transaction scope
    // and flushes them after it completes (confirmed at 1.7.0; sign-up wraps
    // user and session creation in one runWithTransaction), so a signup that
    // mints an immediate session reaches this hook before the auto-join has
    // run. The two joins are idempotent - each skips when the member row
    // already exists.
    if (organizations.signup === 'open') {
      await auth.api.addMember({
        body: {
          userId: session.userId,
          organizationId: organization.id,
          // The canonical no-authority org tier - createAutoJoinHook mints the
          // same value, so whichever join wins the race writes the same row.
          role: 'member',
        },
        headers: getHookRequestHeaders(ctx),
      });
      return { data: { ...session, activeOrganizationId: organization.id } };
    }
    const admitted = await isEmailAdmitted({
      userId: session.userId,
      organizations,
      auth,
      adapter,
      internalAdapter,
    });
    if (admitted) {
      // The member row was a miss above, so admission under invite-only means
      // the pending-invitation carve-out: the invitee needs a session to
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
    const invitation = user ? await findPendingInvitation({ adapter, email: user.email }) : null;
    if (invitation) {
      // An invited user joins the inviter's tenant on accept - mint nothing.
      // If the invitation expires unaccepted, the next login lands here with
      // no pending invitation: invite-only refuses them at the neither branch,
      // while open + operator returns an org-less session.
      return;
    }
    // Neither a membership nor a pending invitation. What happens depends on
    // the two admission knobs.
    if (organizations.signup === 'invite-only') {
      // Reached only by existing users - removed from their last org, or an
      // invitation that expired. New uninvited users never got past the create
      // gate. Same shape as applyPinnedPolicy, so client handling is
      // policy-blind.
      throw new APIError('FORBIDDEN', {
        message: 'You have not been granted access to this application.',
        code: 'MEMBERSHIP_REQUIRED',
      });
    }
    if (organizations.create === 'operator') {
      // open + operator: no membership, no invitation, orgs come only from the
      // operator - return an org-less session (awaiting organization). Public
      // pages see the caller; protected pages are walled until an org is
      // assigned.
      return;
    }
    // open + auto: mint the user's own org as owner.
    // Minted through the org plugin's own adapter layer - the same layer its
    // createOrganization endpoint drives. The endpoint itself cannot serve
    // this call at 1.7.0: a headerless system-action call cannot resolve
    // the engine's dynamic baseURL, and forwarding the firing request's
    // headers makes the endpoint demand a session that does not exist yet.
    const orgPlugin = auth.options.plugins.find((plugin) => plugin.id === 'organization');
    const orgAdapter = getOrgAdapter(await auth.$context, orgPlugin.options);
    const slug = `org-${session.userId}`;
    // The mint is not atomic - an earlier attempt may have written the org
    // row and failed before the member row. Reuse the orphan so the retry
    // does not trip the unique slug index and lock the user out of login.
    let organization = await adapter.findOne({
      model: 'organization',
      where: [{ field: 'slug', value: slug }],
    });
    if (!organization) {
      try {
        organization = await orgAdapter.createOrganization({
          organization: {
            name: user?.name || user?.email || session.userId,
            slug,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        // A racing login minted the org between the find and the create -
        // the unique slug index rejected this write, so read the winner's row.
        organization = await adapter.findOne({
          model: 'organization',
          where: [{ field: 'slug', value: slug }],
        });
        if (!organization) {
          throw error;
        }
      }
    }
    await orgAdapter.createMember({
      userId: session.userId,
      organizationId: organization.id,
      role: 'owner',
    });
    return { data: { ...session, activeOrganizationId: organization.id } };
  }

  return async function activeOrgPolicyHook(session, ctx) {
    const auth = getAuth();
    const { adapter, internalAdapter } = await auth.$context;
    if (organizations.policy === 'tenant') {
      return applyTenantPolicy({ auth, adapter, internalAdapter, session });
    }
    return applyPinnedPolicy({ auth, adapter, internalAdapter, session, ctx });
  };
}

export default createActiveOrgPolicyHook;
