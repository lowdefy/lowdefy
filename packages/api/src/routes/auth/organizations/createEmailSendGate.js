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

import isEmailAdmitted from './isEmailAdmitted.js';

// The engine-tier request hooks.before that gates a public, unauthenticated
// email send - the magic-link send and the one-time-code send. Both are
// unauthenticated: without this gate anyone could make an invite-only app
// deliver its branded sign-in email to any address (and, absent the create
// gate, manufacture orphan records by using it).
//
// A bare handler: the request-hook assembler matches the path and owns the
// createAuthMiddleware wrapper.
//
// When the body email is not admitted the handler returns the gated route's own
// success body - short-circuiting the endpoint (a before-hook return with no
// "context" key becomes the response), so no email is dispatched and no
// verification token or code is minted. Which body that is differs per route
// (/sign-in/magic-link answers { status: true }, /email-otp/send-verification-otp
// answers { success: true }), so the caller names it: a uniform response is what
// makes the "check your email" screen identical whether or not anything was
// sent, and a body that did not match the route's own would give the difference
// away. When admitted it falls through and the normal send proceeds. A no-op
// under open signup (isEmailAdmitted returns admitted).
function createEmailSendGate({ getAuth, organizations, successBody }) {
  return async function emailSendGate(ctx) {
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
    return successBody;
  };
}

export default createEmailSendGate;
