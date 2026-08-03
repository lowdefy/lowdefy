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
  // plugin's sign-in matcher covers /sign-in/email and /sign-in/phone-number
  // only, so an enrolled user walks past their second factor by clicking "email
  // me a link", and so does anyone holding their inbox. No toggle: a magic link
  // is possession-of-inbox, the factor most likely to be compromised in the
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

  return {
    before: createAuthMiddleware(async (ctx) =>
      dispatchRequestHooks({ ctx, registrations: before })
    ),
    after: createAuthMiddleware(async (ctx) => dispatchRequestHooks({ ctx, registrations: after })),
  };
}

export default buildRequestHooks;
