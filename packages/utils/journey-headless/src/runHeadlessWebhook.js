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

import { toWebhookBody, toWebhookHeaders } from '@lowdefy/node-utils';

import addServerFaults from './addServerFaults.js';
import readForcedError from './readForcedError.js';
import readWebhookError from './readWebhookError.js';
import recordDetachedCalls from './recordDetachedCalls.js';

// Runs a webhook step: the body goes to the host's in-process webhook as raw text (a string as
// written, anything else as JSON), with the step's query and headers, as its sender posts it to
// the route, so the endpoint's verify gate runs against those bytes. A refusal is the answer, not
// a failure of the step: expect.status and expect.error read it from the answer this returns
// ({ description, status, error }). The server's faults go to the error sink, but for one a :catch
// of the routine handled (addServerFaults), as for a call step. A routine a fail gate
// failed answers 500 with a fixed message and no request id, so its forced message is read by the
// request id the host's webhook answers with (`rid`). A webhook is no actor's call, so it is not
// recorded for expect.calls, but the detached calls its routine made are, on the current actor
// (recordDetachedCalls): the journey that posts the webhook is the one that checks what it set off.
async function runHeadlessWebhook({ actors, host, step }) {
  const { body, endpoint, headers, query } = step.webhook;
  const answer = await host.webhook({
    endpointId: endpoint,
    headers: toWebhookHeaders(headers),
    query: query ?? {},
    rawBody: toWebhookBody(body),
  });
  addServerFaults({
    call: { endpointId: endpoint, kind: 'webhook' },
    errorSink: host.errorSink,
    faults: answer.faults,
  });
  recordDetachedCalls({ answer, calls: actors.current().calls });
  return {
    description: `webhook "${endpoint}"`,
    error:
      readForcedError({ body: answer.body, rid: answer.rid, session: host.dataSession }) ??
      readWebhookError({ body: answer.body, status: answer.status }),
    status: answer.status,
  };
}

export default runHeadlessWebhook;
