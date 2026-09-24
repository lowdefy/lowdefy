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

// Adapter-direct, like ResetUserTwoFactor. One deleteMany and nothing else:
// there is no passkeyEnabled flag on the user row to clear, and trust-device
// records are a 2FA-plugin concept passkeys do not have.
//
// Its own step rather than folded into ResetUserTwoFactor because "I lost my
// authenticator" and "my security key was stolen" are different incidents with
// different recovery - and because a passkey independently satisfies
// auth.twoFactor.required, so a combined reset would silently lock out someone
// whose passkey was working fine.
//
// passkeyId is optional; omitted revokes all. Both incidents are real: a stolen
// bag wants every credential gone, a lost YubiKey beside a working phone passkey
// wants one. The self-service catalog's PasskeyDelete takes a single passkey, so
// the admin analogue matching it keeps the two surfaces legible together.
//
// Revokes no sessions - RevokeUserSessions exists and the consuming routine pairs
// them. A step that revoked sessions as an undeclared side effect is the hidden
// blast radius the catalog's one-operation-per-step shape avoids.
async function RevokeUserPasskeys({ auth, properties }) {
  const { passkeyId, userId } = properties;
  if (type.isNone(userId)) {
    throw new Error('RevokeUserPasskeys requires a "userId" property.');
  }
  const { adapter } = await auth.$context;
  // userId is always in the where clause, even when passkeyId names one row: the
  // step's authority is bounded to this user, so deleting by id alone would let a
  // caller authorised for one user delete another's credential.
  const where = [{ field: 'userId', value: userId }];
  if (!type.isNone(passkeyId)) {
    where.push({ field: 'id', value: passkeyId });
  }
  return adapter.deleteMany({ model: 'passkey', where });
}

RevokeUserPasskeys.meta = {
  authority: {
    scope: 'org',
    permissions: { user: ['revoke-passkeys'] },
    targetUser: 'userId',
  },
};

export default RevokeUserPasskeys;
