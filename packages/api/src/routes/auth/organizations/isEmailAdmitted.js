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

import { type } from '@lowdefy/helpers';

import ensureOrganization from './ensureOrganization.js';
import findPendingInvitation from './findPendingInvitation.js';

// The one admission predicate, shared by all three enforcement points: the
// session.create wall (which passes a userId), the user.create.before gate and
// the magic-link send gate (which pass an email, before any user exists).
//
// Admission is restrictive under invite-only (either policy). Open signup
// auto-joins under both policies, so the predicate short-circuits to true and
// leaves those flows untouched.
//
// An email is admitted when there is either a member row (keyed by the given
// userId, or by the user resolved from the email) or a pending, unexpired
// invitation for the email. Under pinned the scope is the pinned org; under
// tenant it is membership-anywhere or invitation-anywhere, since admission gates
// deployment-global account existence and there is no target org at signup time.
// The email is lowercased once at entry to match BetterAuth's lowercased-stored
// user.email and the org plugin's lowercased invitation storage, so no
// case-variant address is wrongly suppressed or wrongly admitted.
async function isEmailAdmitted({ email, userId, organizations, auth, adapter, internalAdapter }) {
  if (organizations.signup !== 'invite-only') {
    return true;
  }

  const pinned = organizations.policy === 'pinned';
  const organization = pinned
    ? await ensureOrganization({ auth, slug: organizations.org })
    : undefined;

  const normalizedEmail = type.isString(email) ? email.toLowerCase() : undefined;

  // The member row is keyed by user id. The wall holds the session userId; the
  // create and send gates hold only an email, so resolve the existing user (if
  // any) from it. Conversely the wall needs the email for the invitation lookup,
  // so resolve it from the userId when the caller did not pass one.
  let memberUserId = userId;
  let invitationEmail = normalizedEmail;
  if (type.isNone(memberUserId) && !type.isNone(normalizedEmail)) {
    const found = await internalAdapter.findUserByEmail(normalizedEmail);
    memberUserId = found?.user?.id;
  }
  if (type.isNone(invitationEmail) && !type.isNone(userId)) {
    const user = await internalAdapter.findUserById(userId);
    invitationEmail = user?.email;
  }

  if (!type.isNone(memberUserId)) {
    const where = [{ field: 'userId', value: memberUserId }];
    if (pinned) {
      where.push({ field: 'organizationId', value: organization.id });
    }
    const member = await adapter.findOne({ model: 'member', where });
    if (member) {
      return true;
    }
  }

  if (type.isNone(invitationEmail)) {
    return false;
  }
  const invitation = await findPendingInvitation({
    adapter,
    email: invitationEmail,
    organizationId: pinned ? organization.id : undefined,
  });
  return !type.isNone(invitation);
}

export default isEmailAdmitted;
