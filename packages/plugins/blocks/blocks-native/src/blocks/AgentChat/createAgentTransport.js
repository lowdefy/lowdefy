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

/**
 * The chat transport: the AI SDK's DefaultChatTransport posting to the app's agent route, as the
 * web block's does, with its fetch the block's streamFetch (the host's streaming fetch to the
 * app's server, sent with the caller's bearer session and the shell header). The request is
 * `POST /api/agent/{pageId}/{agentId}?conversationId=…` with `{ messages, urlQuery, pathParams,
 * sharedState, sharedStateReadOnly }`, and the answer is the AI SDK UI message stream as
 * server-sent events.
 *
 * The shared state is read from refs at send time, so a send carries the page's latest values
 * without the transport being rebuilt. onRequest is told of each request as it is made, with the
 * messages it sends, before any of the reply arrives (the threads keep a sent message then).
 *
 * @param {Object} params
 * @param {string} params.agentId Module agent ids hold "/", so it is encoded as one segment.
 * @param {string} params.conversationId
 * @param {string} params.pageId
 * @param {Object} [params.pathParams]
 * @param {{ current: Object|null }} params.sharedStateRef
 * @param {{ current: boolean }} params.sharedStateReadOnlyRef
 * @param {(path: string, init: Object) => Promise<Response>} params.streamFetch
 * @param {Object} [params.urlQuery]
 * @returns {{ sendMessages: Function, reconnectToStream: Function }} A ChatTransport.
 */
function createAgentTransport({
  agentId,
  conversationId,
  onRequest,
  pageId,
  pathParams,
  sharedStateRef,
  sharedStateReadOnlyRef,
  streamFetch,
  urlQuery,
}) {
  const base = `/api/agent/${pageId}/${encodeURIComponent(agentId)}`;
  const transport = new DefaultChatTransport({
    api: `${base}?conversationId=${encodeURIComponent(conversationId)}`,
    // The shell sends no cookies: the session travels as the bearer token streamFetch adds.
    credentials: 'omit',
    fetch: (path, init) => streamFetch(path, init),
    body: () => {
      const sharedState = sharedStateRef.current;
      return {
        ...(urlQuery ? { urlQuery } : {}),
        ...(pathParams ? { pathParams } : {}),
        ...(sharedState ? { sharedState } : {}),
        ...(sharedStateReadOnlyRef.current ? { sharedStateReadOnly: true } : {}),
      };
    },
  });
  return {
    sendMessages: (options) => {
      onRequest({ messages: options.messages, trigger: options.trigger });
      return transport.sendMessages(options);
    },
    reconnectToStream: (options) => transport.reconnectToStream(options),
  };
}

export default createAgentTransport;
