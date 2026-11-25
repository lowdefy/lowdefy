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
import { readSystemCaller } from '@lowdefy/node-utils';

import addServerFaults from './addServerFaults.js';
import readAnswerError from './readAnswerError.js';
import readForcedError from './readForcedError.js';
import recordDetachedCalls from './recordDetachedCalls.js';

const UNBOUND_HINT =
  'It ran as the system bound to no organization. An endpoint that runs per organization needs the binding a CallApi with "organization" and "caller" gives it: name them on the call, as: { system: { organization: <id>, caller: { id, name } } }.';

// The answer of the call the caller makes: a call `as: system` runs the endpoint as the system does
// (host.system), bound to the organization and stand-in caller `as.system` names, if any; anything
// else as the caller's user (host.call).
function callAs({ as, call, caller, host, payload }) {
  if (caller.system === true) {
    const { organization, caller: standIn } = readSystemCaller(as);
    return host.system({ endpointId: call.endpointId, payload, organization, caller: standIn });
  }
  return host.call({ ...call, payload, user: caller.user });
}

// A system call bound to no organization that is refused or fails says how to bind it, since an
// endpoint that runs per organization refuses such a run in its own words.
function readHint({ as, answer }) {
  if (answer.status < 400 || readSystemCaller(as)?.organization !== null) {
    return undefined;
  }
  return UNBOUND_HINT;
}

// Runs a call or request step: the payload as it is given goes to the host's in-process call, as
// the browser runner posts it to the route, as the step's `as` (actors.callerFor) or the current
// actor. A refusal or an error is the answer, not a failure of the step: expect.status and
// expect.error read it from the answer this returns ({ description, status, error }). The call is
// recorded on the caller, for expect.calls, with the detached calls its routine made after it
// (recordDetachedCalls), and the server's faults go to the error sink (addServerFaults). A call a
// fail gate failed answers with the forced message (readForcedError), not the generic one the
// client sees. A system call bound to no organization that fails carries a hint on binding one,
// which the expect steps add to their failures.
async function runHeadlessCall({ actors, host, step }) {
  const isCall = !type.isUndefined(step.call);
  const params = isCall ? step.call : step.request;
  const caller = await actors.callerFor(params.as);
  const payload = params.payload ?? {};
  const call = isCall
    ? { endpointId: params.endpoint, kind: 'endpoint' }
    : { kind: 'request', pageId: params.pageId, requestId: params.requestId };
  const answer = await callAs({ as: params.as, call, caller, host, payload });
  addServerFaults({ call, errorSink: host.errorSink, faults: answer.faults });
  caller.calls.push({
    ...call,
    payload,
    status: answer.status,
    success: answer.success,
    response: answer.response,
    error: answer.error,
  });
  recordDetachedCalls({ answer, calls: caller.calls });
  return {
    description: isCall
      ? `endpoint "${params.endpoint}"`
      : `request "${params.requestId}" on page "${params.pageId}"`,
    error:
      readForcedError({ body: answer.body, session: host.dataSession }) ??
      readAnswerError({ body: answer.body, status: answer.status }),
    hint: readHint({ as: params.as, answer }),
    status: answer.status,
  };
}

export default runHeadlessCall;
