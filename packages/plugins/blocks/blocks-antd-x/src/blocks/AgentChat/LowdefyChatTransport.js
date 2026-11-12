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

// fetchApi is the block's methods.fetchApi: a call to one of the app's own API
// routes by its path. In a browser tab it is fetch under the app's basePath,
// and the session cookie is sent (credentials). A page that runs on another
// origin than its app, such as an MCP App view, calls the app's absolute
// address with its bearer session and never a cookie, and a session that ended
// mid-conversation is replaced and the call sent again.
function createLowdefyChatTransport({
  fetchApi,
  pageId,
  agentId,
  conversationId,
  urlQuery,
  pathParams,
  sharedStateRef,
  sharedStateReadOnlyRef,
}) {
  // The server route takes the last path segment as the agentId — module-scoped
  // agent ids contain '/', so encode the agentId into a single segment.
  const base = `/api/agent/${pageId}/${encodeURIComponent(agentId)}`;
  const api = conversationId
    ? `${base}?conversationId=${encodeURIComponent(conversationId)}`
    : base;
  return new DefaultChatTransport({
    api,
    credentials: 'include',
    fetch: (path, init) => fetchApi(path, init),
    body: () => {
      const sharedState = sharedStateRef?.current;
      return {
        ...(urlQuery ? { urlQuery } : {}),
        ...(pathParams ? { pathParams } : {}),
        ...(sharedState ? { sharedState } : {}),
        ...(sharedStateReadOnlyRef?.current ? { sharedStateReadOnly: true } : {}),
      };
    },
  });
}

export default createLowdefyChatTransport;
