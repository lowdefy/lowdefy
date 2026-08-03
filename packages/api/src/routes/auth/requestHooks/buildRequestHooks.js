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

import createMagicLinkSendGate from '../organizations/createMagicLinkSendGate.js';
import dispatchRequestHooks from './dispatchRequestHooks.js';

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
function buildRequestHooks({ authConfig, getAuth }) {
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

  return {
    before: createAuthMiddleware(async (ctx) =>
      dispatchRequestHooks({ ctx, registrations: before })
    ),
    after: createAuthMiddleware(async (ctx) => dispatchRequestHooks({ ctx, registrations: after })),
  };
}

export default buildRequestHooks;
