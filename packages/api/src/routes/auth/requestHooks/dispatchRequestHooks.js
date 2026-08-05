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

// Runs the registrations claiming ctx.path, in array order. The first result
// that is not undefined short-circuits and becomes the slot's return value:
// for a before slot a return with no "context" key becomes the response, for an
// after slot a returned ctx.json(...) becomes the response body. undefined
// means fall through - to the next matching registration, and when none
// answers, to the endpoint itself. Never return null; BetterAuth reads that as
// a value and would answer with it.
// Thrown errors are left alone - `throw ctx.redirect(...)` and
// `throw new APIError(...)` are how a handler diverts the request.
async function dispatchRequestHooks({ ctx, registrations }) {
  // A createAuthEndpoint.serverOnly endpoint has no path, and
  // dispatchAuthEndpoint sets path: endpoint.path, so an auth.api call to one
  // arrives here with ctx.path undefined - better-auth supports that, and a
  // matcher using path.startsWith would throw out of the hook slot. No
  // registration matches.
  if (!type.isString(ctx.path)) {
    return undefined;
  }
  for (const registration of registrations) {
    if (!registration.matches(ctx.path)) {
      continue;
    }
    const result = await registration.handler(ctx);
    if (result !== undefined) {
      return result;
    }
  }
  return undefined;
}

export default dispatchRequestHooks;
