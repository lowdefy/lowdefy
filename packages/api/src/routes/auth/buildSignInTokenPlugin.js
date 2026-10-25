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

import { createHash } from 'node:crypto';

import { APIError, createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { type } from '@lowdefy/helpers';

import { getRegisteredOrganization } from './organizations/getOrganizationBinding.js';
import modelNames from './modelNames.js';

const EXCHANGE_PATH = '/sign-in-token/exchange';

// One message for every refusal. The reason is logged and never returned, so
// the endpoint is no oracle for which tokens exist, which users are banned or
// which organizations someone belongs to.
const REFUSAL = {
  code: 'INVALID_SIGN_IN_TOKEN',
  message: 'This sign-in link is no longer valid. Sign in to continue.',
};

function isBanned({ user }) {
  if (user.banned !== true) {
    return false;
  }
  return type.isNone(user.banExpires) || new Date(user.banExpires) > new Date();
}

// Sign-in tokens are minted by the CreateSignInToken step for a known user and
// put into an app email. The token is the whole credential: only its SHA-256 is
// stored, and it is spent by a POST to the exchange endpoint - a GET (a mail
// scanner fetching the link) reaches no endpoint at all.
//
// A token is single-use: the exchange spends it with one conditional write
// (issued -> spent), so of two exchanges racing for one token exactly one wins.
// It is single-purpose: the landing it was minted for is the only place its
// exchange lands. The caller names no landing - anything else in the body is
// ignored - so a link cannot be pointed somewhere its email did not.
//
// The session the exchange mints carries the token's scope and the token's id.
// resolveAuthentication reads both: the scope replaces the caller's roles with
// the roles auth.sessionScopes declares, and the token row must still stand, so
// revoking a token or reaching its expiry ends every session it opened.
//
// The plugin declares the model and the endpoint; the steps create and revoke
// the rows.
function buildSignInTokenPlugin({ getAuth, logger, scopes }) {
  function refuse(reason, details = {}) {
    logger.warn(
      { event: 'auth_sign_in_token_refused', reason, ...details },
      `Sign-in token refused: ${reason}.`
    );
    throw new APIError('UNAUTHORIZED', REFUSAL);
  }

  const exchangeSignInToken = createAuthEndpoint(
    EXCHANGE_PATH,
    { method: 'POST', requireHeaders: true },
    async (ctx) => {
      const token = ctx.body?.token;
      if (!type.isString(token) || token === '' || token.length > 512) {
        refuse('malformed token');
      }
      const { adapter, internalAdapter } = ctx.context;
      const row = await adapter.findOne({
        model: 'signInToken',
        where: [{ field: 'hash', value: createHash('sha256').update(token).digest('hex') }],
      });
      if (type.isNone(row)) {
        refuse('unknown token');
      }
      const details = { tokenId: row.id, organizationId: row.organizationId, scope: row.scope };
      if (row.state === 'revoked' || !type.isNone(row.revokedAt)) {
        refuse('revoked token', details);
      }
      if (row.state !== 'issued') {
        refuse('spent token', details);
      }
      if (new Date(row.expiresAt) <= new Date()) {
        refuse('expired token', details);
      }
      // The scope must still be declared. A scope removed from the config
      // leaves its tokens dead rather than carrying roles nobody chose.
      if (!scopes.includes(row.scope)) {
        refuse('scope not declared in auth.sessionScopes', details);
      }
      const registered = getRegisteredOrganization({ auth: getAuth() });
      if (registered?.policy === 'pinned' && row.organizationId !== registered.slug) {
        refuse('token organization is not the pinned organization', details);
      }
      const user = await internalAdapter.findUserById(row.userId);
      if (type.isNone(user)) {
        refuse('user no longer exists', details);
      }
      if (isBanned({ user })) {
        refuse('user is banned', details);
      }
      // A link in an inbox proves possession of the inbox, the factor an
      // enrolled second factor exists to back up. The magic-link verify route
      // challenges an enrolled user for the second factor; a token exchange has
      // no challenge to give, so the person signs in the ordinary way instead.
      if (user.twoFactorEnabled === true) {
        refuse('user has a second factor enrolled', details);
      }
      const member = await adapter.findOne({
        model: 'member',
        where: [
          { field: 'userId', value: user.id },
          { field: 'organizationId', value: row.organizationId },
        ],
      });
      // The token works for the member row it was made for: leaving or removal
      // ends it, and a rejoined member's new row holds no old tokens.
      if (type.isNone(member) || member.id !== row.memberId) {
        refuse('user is not the member the token was made for', details);
      }
      // Spent last, once every check has passed, so a refusal leaves the token
      // as it was. The write matches only an issued row: a concurrent exchange
      // or a revoke that got there first leaves nothing to update.
      const spent = await adapter.update({
        model: 'signInToken',
        where: [
          { field: 'id', value: row.id },
          { field: 'state', value: 'issued' },
        ],
        update: { state: 'spent', spentAt: new Date() },
      });
      if (type.isNone(spent)) {
        refuse('spent token', details);
      }
      // The session ends when the token does. resolveAuthentication also reads
      // the token row on every request, so a revoke ends it sooner.
      const session = await internalAdapter.createSession(
        user.id,
        false,
        {
          activeOrganizationId: row.organizationId,
          expiresAt: new Date(row.expiresAt),
          sessionScope: row.scope,
          signInTokenId: row.id,
        },
        true
      );
      if (type.isNone(session)) {
        throw new APIError('INTERNAL_SERVER_ERROR', {
          code: 'FAILED_TO_CREATE_SESSION',
          message: 'Failed to create a session.',
        });
      }
      await setSessionCookie(ctx, { session, user });
      return ctx.json({ status: true, landing: JSON.parse(row.landing) });
    }
  );

  return {
    id: 'lowdefy-sign-in-token',
    schema: {
      signInToken: {
        modelName: modelNames.signInToken,
        fields: {
          organizationId: { type: 'string', required: true, index: true },
          userId: { type: 'string', required: true, index: true },
          memberId: { type: 'string', required: true },
          scope: { type: 'string', required: true },
          // JSON of { pageId, urlQuery?, pathParams? } or { url } - see
          // CreateSignInToken.
          landing: { type: 'string', required: true },
          // issued, spent or revoked.
          state: { type: 'string', required: true },
          hash: { type: 'string', required: true, unique: true },
          createdAt: { type: 'date', required: true },
          expiresAt: { type: 'date', required: true },
          spentAt: { type: 'date', required: false },
          revokedAt: { type: 'date', required: false },
        },
      },
      session: {
        fields: {
          // Set only by the exchange. input: false keeps both out of reach of
          // a request body, so no client can give its own session a scope.
          sessionScope: { type: 'string', required: false, input: false },
          signInTokenId: { type: 'string', required: false, input: false },
        },
      },
    },
    endpoints: { exchangeSignInToken },
    // The declared scope names, for the steps: they can not read the app's
    // config, and a token must name a scope the app declares.
    options: { scopes },
    // A token is 32 random bytes, so guessing is hopeless; the limit keeps a
    // flood of bad tokens from costing a database read each.
    rateLimit: [
      {
        pathMatcher: (path) => path === EXCHANGE_PATH,
        window: 60,
        max: 30,
      },
    ],
  };
}

export default buildSignInTokenPlugin;
export { EXCHANGE_PATH };
