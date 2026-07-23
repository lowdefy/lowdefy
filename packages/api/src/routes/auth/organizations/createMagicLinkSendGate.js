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

import isEmailAdmitted from './isEmailAdmitted.js';

// The engine-tier request hooks.before that gates the public magic-link send.
// A magic-link send is unauthenticated: without this gate anyone could make an
// invite-only app deliver its branded sign-in email to any address (and, absent
// the create gate, manufacture orphan records by clicking it).
//
// When the body email is not admitted the handler returns the magic-link
// route's own success body { status: true } - short-circuiting the endpoint
// (a before-hook return with no "context" key becomes the response), so no
// email is dispatched and no verification token is minted. The uniform response
// also makes the "check your email" screen identical whether or not a link was
// sent, resisting enumeration on this path. When admitted it falls through and
// the normal send proceeds. A no-op under open and tenant (isEmailAdmitted
// returns admitted).
function createMagicLinkSendGate({ getAuth, organizations }) {
  return createAuthMiddleware(async (ctx) => {
    if (ctx.path !== '/sign-in/magic-link') {
      return undefined;
    }
    const email = ctx.body?.email;
    // No email is the route's own validation error, not an admission decision -
    // fall through and let it answer.
    if (!type.isString(email)) {
      return undefined;
    }
    const auth = getAuth();
    const { adapter, internalAdapter } = await auth.$context;
    const admitted = await isEmailAdmitted({
      email,
      organizations,
      auth,
      adapter,
      internalAdapter,
    });
    if (admitted) {
      return undefined;
    }
    return { status: true };
  });
}

export default createMagicLinkSendGate;
