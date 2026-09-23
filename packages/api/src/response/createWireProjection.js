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

import { lowdefyErrorNames, readErrorCodes } from '@lowdefy/errors';
import { translate } from '@lowdefy/helpers';

// The framework writes these messages to reveal nothing, and clients branch on
// them, so they keep their text where every other non-author error does not.
const AUTH_REFUSAL_NAMES = new Set([
  'AuthenticationError',
  'AuthorizationError',
  'TwoFactorEnrolmentRequiredError',
]);

// The client-bound error policy, as an allowlist. Passed to serializer.serialize
// as `projectError`, so it runs at every error node the walk emits - the cause
// chain, an Error-valued own property, an Error nested in a response value - and
// cannot become depth-limited.
//
// Only the author's message crosses. A library's message embeds whatever the
// library saw - URLs with credentials, SQL, hostnames - so every other error
// becomes one translated generic message plus the fields client config branches
// on. The full error stays in the server log, and in dev reaches the developer
// through `devError`, which config never reads.
//
// The context is optional: a websocket broadcast has no single request, so it
// passes no `rid`, and the server error handler can run before any request
// context exists.
function createWireProjection(context) {
  const requestId = context?.rid;
  const genericMessage = translate({ key: 'server.genericError', i18n: context?.i18n });

  return function project(err) {
    // A PluginError defaults configKey to null; the walk only drops undefined.
    const configKey = err.configKey ?? undefined;

    // Keyed on the name rather than instanceof: the error may come from another
    // copy of @lowdefy/errors or from a serializer round trip, where the class
    // identity is gone but the name survives. The cause is returned raw so the
    // walk projects it too - an Error cause takes the generic shape, and a
    // non-Error cause is author data cleaned as a value.
    if (err.name === 'UserError') {
      return {
        name: err.name,
        message: err.message,
        cause: err.cause,
        metaData: err.metaData,
        blockId: err.blockId,
        pageId: err.pageId,
        isReject: err.isReject,
        configKey,
        isLowdefyError: err.isLowdefyError,
        handled: err.handled,
        requestId,
      };
    }

    const { code, statusCode } = readErrorCodes(err);
    return {
      // A foreign class name can itself say which library or driver failed.
      name: lowdefyErrorNames.has(err.name) ? err.name : 'Error',
      message: AUTH_REFUSAL_NAMES.has(err.name) ? err.message : genericMessage,
      code,
      statusCode,
      configKey,
      requestId,
      // The client revives errors without running a constructor, so this flag
      // exists there only if the wire carries it. Without it the action runner
      // wraps the error in a new ActionError without `handled`, POSTs it back to
      // /api/client-error, and the server logs and reports it a second time.
      isLowdefyError: true,
      handled: err.handled,
    };
  };
}

export default createWireProjection;
