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

import { createAuthMiddleware } from 'better-auth/api';
import { type } from '@lowdefy/helpers';

import createMagicLinkSendGate from '../organizations/createMagicLinkSendGate.js';
import createTwoFactorChallengeHook from './createTwoFactorChallengeHook.js';
import dispatchRequestHooks from './dispatchRequestHooks.js';
import matchOAuthCallback from './matchOAuthCallback.js';
import redirectToChallenge from './redirectToChallenge.js';
import resolveTwoFactorPageUrl from './resolveTwoFactorPageUrl.js';

// The only place options.hooks may be constructed. BetterAuth wraps
// options.hooks.before and options.hooks.after as a single match-all function
// each - not a list - so a second assignment anywhere would silently clobber
// every hook assembled here.
//
// Both slots are returned unconditionally, so the caller assigns options.hooks
// once and the "exactly once" rule holds mechanically rather than by
// convention. An empty registration list is a no-op slot: it returns undefined
// for every path. Whether a registration is added stays conditional on config,
// and those conditions live here so there is one place to read what the engine
// hooks into.
function buildRequestHooks({ authConfig, basePath = '', baseUrlOrigin, getAuth }) {
  const before = [];
  const after = [];

  if (authConfig.magicLink?.enabled === true) {
    before.push({
      id: 'magicLinkSendGate',
      matches: (path) => path === '/sign-in/magic-link',
      handler: createMagicLinkSendGate({
        getAuth,
        organizations: authConfig.organizations,
      }),
    });
  }

  const twoFactorPageUrl = resolveTwoFactorPageUrl({ authConfig, basePath, baseUrlOrigin });

  // https://github.com/better-auth/better-auth/issues/10322 - the two-factor
  // plugin's sign-in matcher covers /sign-in/email, /sign-in/username and
  // /sign-in/phone-number, and nothing else. Of those three only email and
  // phone-number are reachable here, because /sign-in/username needs the
  // username plugin the engine does not register - but the matcher does claim
  // it, so registering a hook for it would double-fire the challenge rather
  // than close a gap. Every other route to a session is uncovered, so an
  // enrolled user walks past their second factor by clicking "email me a
  // link", and so does anyone holding their inbox. No toggle: a magic link is
  // possession-of-inbox, the factor most likely to be compromised in the
  // incident two-factor exists to survive.
  //
  // twoFactorPageUrl is also gated on, so a challenge can never redirect to
  // undefined. Build validation requires the page whenever twoFactor is enabled,
  // which leaves this guard covering direct construction only.
  if (
    authConfig.twoFactor?.enabled === true &&
    authConfig.magicLink?.enabled === true &&
    type.isString(twoFactorPageUrl)
  ) {
    after.push(
      createTwoFactorChallengeHook({
        id: 'magicLinkTwoFactorChallenge',
        matches: (path) => path === '/magic-link/verify',
        // The browser is mid-redirect here with nothing to read a JSON flag
        // with, so this exit redirects rather than returning the password
        // path's { twoFactorRedirect: true }.
        exit: (ctx) => redirectToChallenge({ baseUrlOrigin, ctx, twoFactorPageUrl }),
      })
    );
  }

  // https://github.com/better-auth/better-auth/issues/10322 - the two-factor
  // plugin's sign-in matcher covers neither OAuth callback, so an enrolled user
  // signing in through any IdP walks past their second factor. Both callbacks are
  // hooked: matching only /callback/:id would exempt every non-built-in IdP,
  // because a Lowdefy GenericOAuth provider routes through the genericOAuth
  // plugin's /oauth2/callback/:providerId instead - exactly the enterprise-IdP
  // case the trust declaration exists for.
  //
  // Challenged unless the provider is declared trusted for 2FA. Double-challenging
  // a user who has already cleared Google's own MFA is a functionality loss, and
  // "don't enable two-factor alongside an enterprise IdP" is not advice worth
  // giving: Entra has federated-IdP-MFA trust settings and Okta has the IdP
  // factor, so trust is declared per provider. The trust is declared, not
  // verified - no OAuth claim survives BetterAuth's handling reliably enough to
  // depend on.
  //
  // The trust check belongs in matches, not in the handler: a trusted callback
  // stays on exactly the code path it has today rather than entering the
  // interception and short-circuiting inside it.
  //
  // Registered on twoFactor.enabled alone, not on any provider being configured,
  // so adding a provider later cannot find the hook silently unregistered. The
  // predicate costs nothing on paths that do not match.
  if (authConfig.twoFactor?.enabled === true && type.isString(twoFactorPageUrl)) {
    const trustedProviderKeys = authConfig.twoFactor.mfaTrustedProviderKeys ?? [];
    after.push(
      createTwoFactorChallengeHook({
        id: 'oauthTwoFactorChallenge',
        matches: (path) => {
          const { matched, providerKey } = matchOAuthCallback(path);
          return matched && !trustedProviderKeys.includes(providerKey);
        },
        // Mid-redirect with no JS caller, exactly like /magic-link/verify, so the
        // same shared exit carries the destination the user asked for. Here that
        // destination came from the OAuth state rather than a query parameter,
        // which is why the exit reads the pending redirect's location instead of
        // ctx.query.callbackURL.
        exit: (ctx) => redirectToChallenge({ baseUrlOrigin, ctx, twoFactorPageUrl }),
      })
    );
  }

  return {
    before: createAuthMiddleware(async (ctx) =>
      dispatchRequestHooks({ ctx, registrations: before })
    ),
    after: createAuthMiddleware(async (ctx) => dispatchRequestHooks({ ctx, registrations: after })),
  };
}

export default buildRequestHooks;
