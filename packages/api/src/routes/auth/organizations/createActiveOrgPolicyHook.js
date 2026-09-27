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
import { type } from '@lowdefy/helpers';

import ensureAuthIndexes from './ensureAuthIndexes.js';
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

  // The user's own organization under open + auto. The slugs derive from the
  // user id - org-<userId>, then org-<userId>-2, -3 and on. There are no
  // transactions to lean on (the adapter supports standalone MongoDB), so the
  // mint is two writes made safe by unique indexes (ensureAuthIndexes) and a
  // marker:
  //
  // - The organization row is written with mintPending: true. Only a marked
  //   organization is ever joined as its owner here: one minted for this
  //   user whose owner row was never written - a mint that failed between
  //   its two writes, or one a concurrent session of the same user (a double
  //   submit, two tabs) is finishing right now. The marker is cleared once
  //   the owner row exists, so an organization everyone later left - with its
  //   data and pending invitations - is never handed back; the user moves on
  //   to the next slug and gets a fresh organization.
  // - Two sessions creating the same slug: the unique slug index rejects the
  //   second, which reads the winner's row.
  // - Two sessions writing the owner row, in any order around each other's
  //   writes: the unique (user, organization) index rejects the second, which
  //   reads the winner's row. The member row is always written before the
  //   marker is cleared, so a session that sees the marker cleared finds the
  //   member row.
  async function findMember({ adapter, userId, organizationId }) {
    return adapter.findOne({
      model: 'member',
      where: [
        { field: 'userId', value: userId },
        { field: 'organizationId', value: organizationId },
      ],
    });
  }

  async function findOrCreateOrganization({ adapter, name, slug }) {
    const existing = await adapter.findOne({
      model: 'organization',
      where: [{ field: 'slug', value: slug }],
    });
    if (existing) {
      return existing;
    }
    try {
      return await adapter.create({
        model: 'organization',
        data: { name, slug, mintPending: true, createdAt: new Date() },
      });
    } catch (error) {
      const winner = await adapter.findOne({
        model: 'organization',
        where: [{ field: 'slug', value: slug }],
      });
      if (!winner) {
        throw error;
      }
      return winner;
    }
  }

  async function joinAsOwner({ adapter, userId, organizationId }) {
    try {
      await adapter.create({
        model: 'member',
        data: { userId, organizationId, role: 'owner', createdAt: new Date() },
      });
    } catch (error) {
      const winner = await findMember({ adapter, userId, organizationId });
      if (type.isNone(winner)) {
        throw error;
      }
    }
  }

  async function clearMintPending({ adapter, organization }) {
    if (organization.mintPending !== true) {
      return;
    }
    await adapter.update({
      model: 'organization',
      where: [{ field: 'id', value: organization.id }],
      update: { mintPending: false },
    });
  }

  async function findOrMintOwnOrganization({ adapter, session, user }) {
    const name = user?.name || user?.email || session.userId;
    for (let suffix = 1; ; suffix += 1) {
      const slug = suffix === 1 ? `org-${session.userId}` : `org-${session.userId}-${suffix}`;
      const organization = await findOrCreateOrganization({ adapter, name, slug });
      const member = await findMember({
        adapter,
        userId: session.userId,
        organizationId: organization.id,
      });
      if (type.isNone(member) && organization.mintPending !== true) {
        continue;
      }
      if (type.isNone(member)) {
        await joinAsOwner({ adapter, userId: session.userId, organizationId: organization.id });
      }
      await clearMintPending({ adapter, organization });
      return organization;
    }
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
    // Written through the adapter, not the org plugin's createOrganization
    // endpoint: a headerless system-action call cannot resolve the engine's
    // dynamic baseURL at 1.7.0, and forwarding the firing request's headers
    // makes the endpoint demand a session that does not exist yet. The mint
    // is only safe behind the unique indexes, so it refuses without them.
    await ensureAuthIndexes({ auth, logger });
    const organization = await findOrMintOwnOrganization({ adapter, session, user });
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
