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

import { randomBytes } from 'node:crypto';

import { AuthenticationError, AuthorizationError, LowdefyInternalError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import pruneViewSessions from './pruneViewSessions.js';
import signSessionToken from './signSessionToken.js';
import { VIEW_SESSION_EXPIRES_IN, VIEW_SESSION_TOKEN_PREFIX } from './viewSessionLimits.js';

// Mints the bearer session an MCP App view signs in with, for the caller the
// /api/mcp route resolved. The MCP access token cannot be used on any other
// route, so the view asks for a session of its own: the caller's user, in the
// grant's organization, marked view and recording the grant's client and
// scopes. Returns the signed session token - the form the bearer plugin
// accepts - and when it expires.
//
// Only a caller holding an OAuth grant gets one: the session is tied to the
// grant's consent row and dies with it (resolveViewSession). A member token has
// no grant and is refused, as is the anonymous caller.
//
// Any holder of the MCP bearer can call this, whatever the host hides from the
// model. What makes that safe is what the session is: fifteen minutes long,
// never extended, capped by the grant's scopes, and at most
// VIEW_SESSIONS_PER_GRANT per grant.
async function mintViewSession(context) {
  const { mcpAuth, user } = context;
  if (type.isNone(user) || mcpAuth?.tokenStatus !== 'valid') {
    throw new AuthenticationError('A view session needs a signed-in MCP caller.');
  }
  if (!type.isNone(mcpAuth.tokenId) || !type.isString(mcpAuth.clientId)) {
    throw new AuthorizationError(
      'A view session needs an OAuth connection. A member token cannot open one.'
    );
  }
  const { clientId, grantedScopes, organizationId } = mcpAuth;
  const { adapter, internalAdapter, secret } = await context.auth.$context;
  const expiresAt = new Date(Date.now() + VIEW_SESSION_EXPIRES_IN * 1000);
  const session = await internalAdapter.createSession(
    user.id,
    false,
    {
      expiresAt,
      token: `${VIEW_SESSION_TOKEN_PREFIX}${randomBytes(32).toString('base64url')}`,
      view: true,
      viewClientId: clientId,
      viewScopes: grantedScopes.join(' '),
    },
    true
  );
  if (type.isNone(session)) {
    throw new LowdefyInternalError('The view session was not created.');
  }
  // The organization policy hook (session.create.before) picks the session's
  // organization itself - the oldest membership under tenant - so the grant's
  // organization is set once the row exists. Nobody holds the token yet.
  if (session.activeOrganizationId !== organizationId) {
    await adapter.update({
      model: 'session',
      where: [{ field: 'id', value: session.id }],
      update: { activeOrganizationId: organizationId },
    });
  }
  const pruned = await pruneViewSessions({
    adapter,
    clientId,
    internalAdapter,
    organizationId,
    userId: user.id,
  });
  context.logger.info(
    {
      event: 'mcp_view_session_minted',
      clientId,
      organizationId,
      pruned,
      sessionId: session.id,
      userId: user.id,
    },
    `Minted view session "${session.id}" for user "${user.id}" in organization "${organizationId}".`
  );
  return {
    token: signSessionToken({ secret, token: session.token }),
    expiresAt,
  };
}

export default mintViewSession;
