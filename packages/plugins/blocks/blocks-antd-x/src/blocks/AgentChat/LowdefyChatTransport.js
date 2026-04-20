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

import { DefaultChatTransport } from 'ai';

// Wraps the fetch response body in a logging ReadableStream tee-like tap so we
// can observe first-byte and per-chunk arrivals without changing the payload.
function wrapResponseBody(response, { phaseLoggerRef }) {
  if (!response?.body || !phaseLoggerRef?.current) return response;

  const logger = phaseLoggerRef.current;
  const origBody = response.body;
  const reader = origBody.getReader();
  let firstByteLogged = false;
  let chunkCount = 0;
  let totalBytes = 0;

  const tapped = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          logger.phase('client.transport.body.done', { chunkCount, totalBytes });
          controller.close();
          return;
        }
        if (!firstByteLogged) {
          firstByteLogged = true;
          logger.phase('client.transport.first_byte', {
            bytes: value?.byteLength ?? 0,
          });
        }
        chunkCount += 1;
        totalBytes += value?.byteLength ?? 0;
        if (chunkCount <= 3 || chunkCount % 25 === 0) {
          logger.phase('client.transport.chunk', {
            chunkIndex: chunkCount,
            bytes: value?.byteLength ?? 0,
          });
        }
        controller.enqueue(value);
      } catch (err) {
        logger.phase('client.transport.body.error', { err: err?.message });
        controller.error(err);
      }
    },
    cancel(reason) {
      reader.cancel(reason);
    },
  });

  // Construct a new Response sharing headers/status but streaming the tapped body.
  return new Response(tapped, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function createLowdefyChatTransport({
  pageId,
  agentId,
  conversationId,
  urlQuery,
  sharedStateRef,
  turnIdRef,
  phaseLoggerRef,
}) {
  const base = `/api/agent/${pageId}/${agentId}`;
  const api = conversationId
    ? `${base}?conversationId=${encodeURIComponent(conversationId)}`
    : base;

  async function loggingFetch(input, init) {
    const logger = phaseLoggerRef?.current;
    const bodySize = (() => {
      try {
        if (!init?.body) return 0;
        if (typeof init.body === 'string') return init.body.length;
        return -1;
      } catch {
        return -1;
      }
    })();
    logger?.phase('client.transport.send.start', { bodySize });
    const response = await fetch(input, init);
    logger?.phase('client.transport.response.headers', { status: response.status });
    return wrapResponseBody(response, { phaseLoggerRef });
  }

  return new DefaultChatTransport({
    api,
    credentials: 'include',
    fetch: phaseLoggerRef ? loggingFetch : undefined,
    body: () => {
      const sharedState = sharedStateRef?.current;
      const turnId = turnIdRef?.current;
      return {
        ...(urlQuery ? { urlQuery } : {}),
        ...(sharedState ? { sharedState } : {}),
        ...(turnId ? { turnId } : {}),
      };
    },
  });
}

export default createLowdefyChatTransport;
