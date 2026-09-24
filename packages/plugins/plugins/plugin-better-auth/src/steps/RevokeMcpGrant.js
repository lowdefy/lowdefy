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

// The calling assistant gives up its own grant. The MCP route resolved the
// caller from an access token whose organization_id claim and client are in
// context.mcpAuth; the grant behind that token is the oauthConsent row for
// (client, user, organization) - the referenceId the authorization server
// keyed consent on - and the refresh tokens minted under it. Deleting the
// consent makes the route refuse the current access token at once (it reads
// the live grant on every request) and revoking the refresh tokens keeps the
// client from minting another, so its next call is a 401 challenge and it
// re-runs the authorization - login, the organization choice, consent.
//
// Scoped to the caller's own grant for this one client and organization:
// another assistant the same person connected, or this assistant's grant in
// another organization, is untouched.
async function RevokeMcpGrant({ acting, auth, mcp }) {
  if (type.isNone(mcp) || mcp.tokenStatus !== 'valid') {
    throw new Error(
      'RevokeMcpGrant can only run for a caller authenticated over MCP - it revokes the grant behind the calling access token.'
    );
  }
  const { clientId, organizationId } = mcp;
  const userId = acting.user.id;
  const { adapter } = await auth.$context;
  const where = [
    { field: 'clientId', value: clientId },
    { field: 'userId', value: userId },
    { field: 'referenceId', value: organizationId },
  ];
  await adapter.deleteMany({ model: 'oauthConsent', where });
  await adapter.updateMany({
    model: 'oauthRefreshToken',
    where: [...where, { field: 'revoked', operator: 'eq', value: null }],
    update: { revoked: new Date() },
  });
  return { clientId, organizationId, userId };
}

// The step touches only rows the caller owns (their own consent and refresh
// tokens for the client they are calling from), so it needs a caller and no
// organization authority.
RevokeMcpGrant.meta = { authority: { scope: 'caller' } };

export default RevokeMcpGrant;
