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

import readAnswerError from './readAnswerError.js';

// Runs a call or request step: the payload as it is given goes to the host's in-process call, as
// the browser runner posts it to the route, as the step's `as` (actors.callerFor) or the current
// actor. A refusal or an error is the answer, not a failure of the step: expect.status and
// expect.error read it from the answer this returns ({ description, status, error }). The call is
// recorded on the caller, for expect.calls, and the server's faults go to the error sink.
async function runHeadlessCall({ actors, host, step }) {
  const isCall = !type.isUndefined(step.call);
  const params = isCall ? step.call : step.request;
  const caller = await actors.callerFor(params.as);
  const payload = params.payload ?? {};
  const call = isCall
    ? { endpointId: params.endpoint, kind: 'endpoint' }
    : { kind: 'request', pageId: params.pageId, requestId: params.requestId };
  const answer = await host.call({ ...call, payload, user: caller.user });
  answer.faults.forEach((fault) => host.errorSink.add({ call, error: fault, source: 'server' }));
  caller.calls.push({
    ...call,
    payload,
    status: answer.status,
    success: answer.success,
    response: answer.response,
    error: answer.error,
  });
  return {
    description: isCall
      ? `endpoint "${params.endpoint}"`
      : `request "${params.requestId}" on page "${params.pageId}"`,
    error: readAnswerError({ body: answer.body, status: answer.status }),
    status: answer.status,
  };
}

export default runHeadlessCall;
