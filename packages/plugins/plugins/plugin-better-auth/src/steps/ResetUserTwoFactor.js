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

// Adapter-direct, like UpdateUserAttributes: the raw adapter.* surface fires no
// user.update database hooks. BetterAuth's own /two-factor/enable and
// /two-factor/disable take their target from ctx.context.session.user - self only,
// password-gated - so there is no endpoint an admin reset could call.
//
// The input: false guard on twoFactorEnabled does NOT apply here, and the
// asymmetry is surprising enough to be worth stating: parseInputData is reached
// only through internalAdapter / with-hooks (dist/db/schema.mjs:110-136 are its
// only call sites), and the raw adapter.* surface this step uses does not run it.
// So this step writes twoFactorEnabled where /admin/update-user cannot.
//
// This step does NOT revoke sessions: clearing twoFactorEnabled does not end a
// session, so the thief keeps the one they hold - the scenario the step exists
// for. A routine calling this without RevokeUserSessions has not recovered the
// account. The pairing belongs in the routine, not as a forgettable option here.
async function ResetUserTwoFactor({ auth, properties }) {
  const { userId } = properties;
  if (type.isNone(userId)) {
    throw new Error('ResetUserTwoFactor requires a "userId" property.');
  }
  const { adapter } = await auth.$context;

  // 1. The secret and the backup codes share one twoFactor row, so one delete
  // takes both. auth-hardening Decision 6's unique index on twoFactor.userId
  // makes that one row rather than an assumption.
  await adapter.deleteMany({
    model: 'twoFactor',
    where: [{ field: 'userId', value: userId }],
  });

  // 2. Clear the flag the sign-in hook reads. This stops the challenge firing;
  // it does NOT end any session.
  const user = await adapter.update({
    model: 'user',
    where: [{ field: 'id', value: userId }],
    update: { twoFactorEnabled: false },
  });

  // 3. Delete the user's trust-device verification records. Load-bearing, not
  // tidying: a device the user ticked "trust this device" on holds a signed
  // trust_device cookie backed by one of these records (default 30 days). The
  // exposure bites AFTER re-enrolment - once step 2 clears the flag the sign-in
  // hook returns early and challenges nobody, but when the victim re-enrols the
  // thief's device skips the challenge they just set up. The cookie cannot be
  // expired from an admin's request; deleting the record suffices, because the
  // sign-in hook looks it up and falls through to the challenge when absent.
  //
  // BOTH clauses are required. Records are { identifier: 'trust-device-<random32>',
  // value: user.id, expiresAt } - the identifier carries no user binding and the
  // user binding carries no record type. Without the identifier clause this would
  // take EVERY verification row keyed to this user, and auth-hardening writes
  // { identifier: '2fa-<random20>', value: user.id } on three sign-in paths, so a
  // reset would wipe unrelated in-flight challenges.
  await adapter.deleteMany({
    model: 'verification',
    where: [
      { field: 'value', value: userId },
      { field: 'identifier', value: 'trust-device-', operator: 'starts_with' },
    ],
  });

  if (type.isNone(user)) {
    // Mirrors UpdateUserAttributes - an unknown userId must fail loudly. A silent
    // no-op leaves the admin believing the person can now sign in.
    throw new Error(`ResetUserTwoFactor found no user with id "${userId}".`);
  }
  return user;
}

// No selfTargetExempt: a user who still holds their authenticator uses
// self-service; one without has no session, which is the whole premise of this
// step. The reset lands on the deployment-wide user row and its twoFactor and
// verification rows, so org authority alone would let an administrator of any
// organization reach any user - targetUser makes the floor require the target to
// hold a member row in the organization the caller administers.
ResetUserTwoFactor.meta = {
  authority: {
    scope: 'org',
    permissions: { user: ['reset-two-factor'] },
    targetUser: 'userId',
  },
};

export default ResetUserTwoFactor;
