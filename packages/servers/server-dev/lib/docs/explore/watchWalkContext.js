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

import isAppApiUrl from './isAppApiUrl.js';

// Buffers, with timestamps, what a walk's browser context does that the
// invariants read over a step's window: uncaught page errors, and the
// requests to and responses from the app's request and endpoint API routes.
// Hooked in before the context's first request, so the first page load is
// watched too. Client error reports still in flight are counted, so a step's
// window waits for them before it closes.
function watchWalkContext({ context, events, origin, basePath }) {
  const clientErrorPath = `${basePath}/api/client-error`;
  function isClientErrorPost(request) {
    try {
      const url = new URL(request.url());
      return url.origin === origin && url.pathname === clientErrorPath;
    } catch {
      return false;
    }
  }
  function settleClientErrorPost(request) {
    if (isClientErrorPost(request)) events.pendingClientErrors.delete(request);
  }
  context.on('requestfinished', settleClientErrorPost);
  context.on('requestfailed', settleClientErrorPost);
  context.on('weberror', (webError) => {
    const error = webError.error();
    events.pageErrors.push({
      time: Date.now(),
      name: error?.name ?? 'Error',
      message: error?.message ?? String(error),
      stack: error?.stack ?? null,
    });
  });
  context.on('request', (request) => {
    if (isClientErrorPost(request)) events.pendingClientErrors.add(request);
    if (!isAppApiUrl({ url: request.url(), origin, basePath })) return;
    events.requests.push({ time: Date.now(), url: request.url(), method: request.method() });
  });
  context.on('response', (response) => {
    if (!isAppApiUrl({ url: response.url(), origin, basePath })) return;
    events.responses.push({
      time: Date.now(),
      url: response.url(),
      method: response.request().method(),
      status: response.status(),
    });
  });
}

export default watchWalkContext;
