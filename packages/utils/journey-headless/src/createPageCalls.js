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

import readAnswer from './readAnswer.js';

// The page's callRequest and callAPI (lowdefy._internal), on the host's in-process calls instead
// of HTTP. Each sends what createCallRequest.js and createCallAPI.js post, as the page's user,
// returns or throws what they would, and is recorded in `calls` with its payload, response and
// error deserialized, for expect.calls. The server's faults go to the error sink.
function createPageCalls({ calls, host, user }) {
  async function send({ call, record }) {
    const answer = await host.call({ ...call, user });
    answer.faults.forEach((fault) =>
      host.errorSink.add({ call: record, error: fault, source: 'server' })
    );
    calls.push({
      ...record,
      payload: serializer.deserialize(call.payload),
      status: answer.status,
      success: answer.success,
      response: answer.response,
      error: answer.error,
    });
    return readAnswer(answer);
  }
  return {
    callAPI: ({ blockId, endpointId, pageId, payload }) =>
      send({
        call: { blockId, endpointId, kind: 'endpoint', pageId, payload },
        record: { blockId, endpointId, kind: 'endpoint', pageId },
      }),
    callRequest: ({ actionId, blockId, pageId, payload, requestId }) =>
      send({
        call: { actionId, blockId, kind: 'request', pageId, payload, requestId },
        record: { actionId, blockId, kind: 'request', pageId, requestId },
      }),
  };
}

export default createPageCalls;
