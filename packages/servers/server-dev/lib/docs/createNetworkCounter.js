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

import matchJourneyRoute from './matchJourneyRoute.js';

function requestKey({ pageId, requestId }) {
  return JSON.stringify([pageId, requestId]);
}

// Counts what one journey actor's browser context asked the dev server for.
// It lives in Node and is fed by Playwright's context-level request event, so
// the counts survive full page loads, which replace everything in the page.
function createNetworkCounter({ origin, basePath }) {
  const pages = new Set();
  const requests = new Map();
  const endpoints = new Map();
  let appEvents = false;

  function record(request) {
    const match = matchJourneyRoute({
      url: request.url(),
      method: request.method(),
      origin,
      basePath,
    });
    if (match === null) {
      return;
    }
    switch (match.route) {
      case 'root':
        appEvents = true;
        return;
      case 'page':
        pages.add(match.pageId);
        return;
      case 'request': {
        const key = requestKey(match);
        const entry = requests.get(key) ?? {
          pageId: match.pageId,
          requestId: match.requestId,
          calls: 0,
        };
        entry.calls += 1;
        requests.set(key, entry);
        return;
      }
      case 'endpoint':
        endpoints.set(match.endpointId, (endpoints.get(match.endpointId) ?? 0) + 1);
        return;
      default:
        return;
    }
  }

  function countCalls({ request, pageId, endpoint }) {
    if (!type.isUndefined(endpoint)) {
      return endpoints.get(endpoint) ?? 0;
    }
    return requests.get(requestKey({ pageId, requestId: request }))?.calls ?? 0;
  }

  function snapshot() {
    return {
      pages: [...pages],
      appEvents,
      requests: [...requests.values()].map((entry) => ({ ...entry })),
      endpoints: [...endpoints.entries()].map(([endpointId, calls]) => ({ endpointId, calls })),
    };
  }

  return { record, countCalls, snapshot };
}

export default createNetworkCounter;
