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

import { serializer } from '@lowdefy/helpers';
import { ConfigError, LowdefyInternalError } from '@lowdefy/errors';
import { getMarkedCredentials } from '@lowdefy/node-utils';

import dispatchDetached from './dispatchDetached.js';
import scheduleBackground from './scheduleBackground.js';

// How a server sends a detached CallApi: fire-and-forget the call back through the deployment's
// /api/detached route, so the target runs in its OWN function invocation with a fresh duration
// budget (chainable bounded work without a queue). At-most-once, no retry: targets must be
// idempotent. The dispatch promise rides the platform request context so the outgoing request
// always leaves before the invocation is reaped; the target's own outcome exists only in its logs
// and whatever its routine writes. The route fails closed without CRON_SECRET, so a call made
// without it fails here, at its step.
function sendDetachedRequest(context, { callContext, endpointId, payload, routineContext, step }) {
  if (!process.env.CRON_SECRET) {
    throw new ConfigError(
      'CallApi with "detached: true" requires the CRON_SECRET environment variable — the /api/detached route fails closed without it.',
      { configKey: step['~k'] }
    );
  }
  if (!context.origin) {
    throw new LowdefyInternalError(
      'Detached endpoint calls require the request origin on context.'
    );
  }
  scheduleBackground(context, { event: 'detached_dispatch', endpointId }, () =>
    dispatchDetached(`${context.origin}/api/detached/${endpointId}`, {
      method: 'POST',
      headers: {
        // The dev server's journey cookies (data set, mutant) ride the hop so the target runs in
        // the same journey run; the production server sets none. Spread first so content-type
        // and authorization win.
        ...(context.loopbackHeaders ?? {}),
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      // Carry the already-resolved dispatcher identity across the hop (Decision 4): a detached
      // call is a fresh invocation, not a fresh principal. The receiver rehydrates context.user /
      // context.system from this snapshot and authorizes nested calls against it through the
      // normal path - so a user-dispatched detached run reaches nothing the user could not reach
      // synchronously, and a cron/hook/verified-webhook run blanket-passes like its dispatcher.
      // Built server-side from the resolved context, never from user input; the CRON_SECRET
      // proves origin, which is what lets the receiver trust the assertion.
      body: JSON.stringify({
        payload: serializer.serialize(payload),
        principal: {
          user: serializer.serialize(callContext.user ?? null),
          system: callContext.system === true,
          organizationId: callContext.boundOrganizationId ?? null,
          agent: routineContext.agent ?? null,
          // A detached run of a view session is still that view session's: it is held to its
          // grant's scopes as the dispatching run is.
          viewSession: callContext.viewSession ?? null,
        },
        // The values this request marked with _credential, so the target's logs scrub them too:
        // the target runs as a new request with a scope of its own.
        credentials: getMarkedCredentials(),
      }),
    })
  );
}

export default sendDetachedRequest;
