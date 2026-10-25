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

import getSignInTokenScopes from './support/getSignInTokenScopes.js';

// Revokes a person's sign-in tokens, optionally only one scope's or one
// organization's - spent ones included, since a spent token's session lives on
// until the token expires. A revoked token opens no new session, and the
// sessions it already opened stop resolving on their next request. Rows are
// kept, with revokedAt set once, as the record of what was issued.
//
// Caller-less, like CreateSignInToken: an app revokes from a trusted routine
// (a person left, a link was forwarded) rather than letting a caller revoke
// someone else's.
async function RevokeSignInTokens({ auth, properties }) {
  if (type.isNone(getSignInTokenScopes({ auth }))) {
    throw new Error(
      'RevokeSignInTokens needs a session scope - declare one under "auth.sessionScopes".'
    );
  }
  const { userId, organizationId, scope } = properties ?? {};
  if (!type.isString(userId) || userId === '') {
    throw new Error('RevokeSignInTokens requires a non-empty string "userId" property.');
  }
  const where = [{ field: 'userId', value: userId }];
  if (!type.isNone(organizationId)) {
    where.push({ field: 'organizationId', value: organizationId });
  }
  if (!type.isNone(scope)) {
    where.push({ field: 'scope', value: scope });
  }
  const { adapter } = await auth.$context;
  const rows = await adapter.findMany({ model: 'signInToken', where });
  const standing = rows.filter((row) => type.isNone(row.revokedAt));
  const revokedAt = new Date();
  await Promise.all(
    standing.map((row) =>
      adapter.update({
        model: 'signInToken',
        where: [{ field: 'id', value: row.id }],
        update: { state: 'revoked', revokedAt },
      })
    )
  );
  return { revoked: standing.length };
}

RevokeSignInTokens.meta = { authority: { scope: 'system' } };

export default RevokeSignInTokens;
