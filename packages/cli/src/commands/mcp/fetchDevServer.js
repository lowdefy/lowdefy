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
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

const DROPPED_MESSAGE = 'The dev server closed the connection before it answered.';

// The JSON-RPC request a POST carries, when it carries exactly one. Batches,
// notifications and the GET push stream are left alone.
function readRequestId(init) {
  if (init?.method !== 'POST' || !type.isString(init.body)) {
    return undefined;
  }
  const message = JSON.parse(init.body);
  if (!type.isObject(message) || !type.isString(message.method) || type.isNone(message.id)) {
    return undefined;
  }
  return message.id;
}

function isAnswer({ data, requestId }) {
  try {
    const message = JSON.parse(data);
    return message?.id === requestId && ('result' in message || 'error' in message);
  } catch {
    // Not JSON-RPC: a ping or a line cut short by the drop.
    return false;
  }
}

function encodeDroppedAnswer(requestId) {
  const message = {
    jsonrpc: '2.0',
    id: requestId,
    error: { code: ErrorCode.ConnectionClosed, message: DROPPED_MESSAGE },
  };
  // The blank line first ends whatever event the drop cut short.
  return new TextEncoder().encode(`\n\nevent: message\ndata: ${JSON.stringify(message)}\n\n`);
}

// Passes the event stream through, watching its data lines for the answer to
// the request, and answers the request with a ConnectionClosed error itself
// when the stream ends or breaks without one.
function answerWhenDropped({ body, requestId }) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let partialLine = '';
  let answered = false;

  function scan(chunk) {
    const lines = (partialLine + decoder.decode(chunk, { stream: true })).split('\n');
    partialLine = lines.pop();
    lines.forEach((line) => {
      if (!answered && line.startsWith('data:')) {
        answered = isAnswer({ data: line.slice(5).trim(), requestId });
      }
    });
  }

  function finish(controller) {
    if (!answered) {
      controller.enqueue(encodeDroppedAnswer(requestId));
    }
    controller.close();
  }

  return new ReadableStream({
    async pull(controller) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch {
        // Reset, closed mid-chunk, or the dev server's process is gone.
        finish(controller);
        return;
      }
      if (chunk.done) {
        finish(controller);
        return;
      }
      scan(chunk.value);
      controller.enqueue(chunk.value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}

// The fetch the shim's MCP transport uses to reach a dev server. A tool call
// answered as an event stream that drops before the answer (the dev server
// was killed, or its proxy lost the server behind it) would otherwise wait
// out the whole tool call timeout: the MCP SDK resumes a dropped stream only
// when the server sent event ids, which the dev server does not, and reports
// the drop to onerror alone, never to the pending request.
async function fetchDevServer(url, init) {
  const response = await fetch(url, init);
  const requestId = readRequestId(init);
  const contentType = response.headers.get('content-type') ?? '';
  if (
    type.isUndefined(requestId) ||
    !response.ok ||
    !contentType.includes('text/event-stream') ||
    type.isNone(response.body)
  ) {
    return response;
  }
  return new Response(answerWhenDropped({ body: response.body, requestId }), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export { DROPPED_MESSAGE };
export default fetchDevServer;
