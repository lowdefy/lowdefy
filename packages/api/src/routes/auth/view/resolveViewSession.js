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

import isUserBanned from '../isUserBanned.js';
import mcpScopes from '../../mcp/mcpScopes.js';
import { VIEW_SESSION_EXPIRES_IN } from './viewSessionLimits.js';

// The checks a view session passes before it resolves as its member, on top of
// everything any session passes. Returns what context.viewSession carries,
// { clientId, grantedScopes }, or null when the session must resolve
// unauthenticated.
//
// - Its age is read from createdAt, which nothing updates, as well as from the
//   expiry the refresh hook holds: a session that outlived fifteen minutes by
//   any path is refused here.
// - It dies with its grant: the consent row for (client, user, organization)
//   must still stand, read live as the MCP bearer branch reads it, so a grant
//   the member gave up stops its view sessions at once.
// - It never exceeds its grant: the scopes recorded at minting are cut to the
//   ones the consent row still carries, so a grant narrowed since, or the grant
//   of another organization the session was switched to, caps it.
// - A banned user is refused. A ban deletes the user's sessions; this covers
//   one minted from an MCP bearer in the same moment.
async function resolveViewSession(context, { adapter, session }) {
  const { activeOrganizationId, createdAt, id, viewClientId, viewScopes } = session.session;
  if (!type.isString(viewClientId) || !type.isString(activeOrganizationId)) {
    context.logger.debug(
      { event: 'auth_view_session_rejected', sessionId: id },
      `View session "${id}" rejected: it names no client or no organization.`
    );
    return null;
  }
  const age = Date.now() - new Date(createdAt).getTime();
  if (!(age < VIEW_SESSION_EXPIRES_IN * 1000)) {
    context.logger.debug(
      { event: 'auth_view_session_rejected', sessionId: id },
      `View session "${id}" rejected: it is older than ${VIEW_SESSION_EXPIRES_IN} seconds.`
    );
    return null;
  }
  if (isUserBanned({ user: session.user })) {
    context.logger.debug(
      { event: 'auth_view_session_rejected', sessionId: id },
      `View session "${id}" rejected: user "${session.user.id}" is banned.`
    );
    return null;
  }
  const consent = await adapter.findOne({
    model: 'oauthConsent',
    where: [
      { field: 'clientId', value: viewClientId },
      { field: 'userId', value: session.user.id },
      { field: 'referenceId', value: activeOrganizationId },
    ],
  });
  if (type.isNone(consent)) {
    context.logger.debug(
      {
        event: 'auth_view_session_grant_revoked',
        clientId: viewClientId,
        organizationId: activeOrganizationId,
        sessionId: id,
      },
      `View session "${id}" rejected: no consent stands for client "${viewClientId}" in organization "${activeOrganizationId}" - the grant was revoked.`
    );
    return null;
  }
  const recordedScopes = (type.isString(viewScopes) ? viewScopes : '').split(' ');
  const consentScopes = type.isArray(consent.scopes) ? consent.scopes : [];
  return {
    clientId: viewClientId,
    grantedScopes: mcpScopes.filter(
      (scope) => recordedScopes.includes(scope) && consentScopes.includes(scope)
    ),
  };
}

export default resolveViewSession;
