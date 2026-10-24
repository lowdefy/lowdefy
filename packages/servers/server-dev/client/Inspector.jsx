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

import { useContext, useEffect, useRef } from 'react';

import { type, serializer } from '@lowdefy/helpers';

import DevStreamContext from './DevStreamContext.js';

// Dev-only agent-state-xray channel. Listens for inspect-request/eval-request
// events on the tab's single /api/reload EventSource (owned by Reload.jsx,
// shared through DevStreamContext) rather than opening its own — a second
// stream per tab exhausted the browser's HTTP/1.1 connection pool once a few
// tabs of the same app were open, and every later fetch queued forever.
//
// Page tracking: routes/reload.js registers every connection as an
// inspectable tab (lib/docs/tabChannel.js) and announces the tab id on the
// stream. This component then posts { tabId, pageId, pathParams, instanceKey }
// to /api/dev-inspect/page whenever the page instance on screen changes, so the
// registry's view of "what instance is this tab on" stays current without
// reconnecting. A request names the instance to read (the dev server picks
// it); without one it reads the instance on screen.
//
// Never let a bad payload or a plugin's operator error crash the app this is
// piggybacking on — every handler is wrapped, and the component itself
// always renders null.
function postJson({ basePath, path, body }) {
  try {
    fetch(`${basePath}/api/dev-inspect${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {
      // Best-effort — a failed callback just leaves the agent's request to
      // time out server-side, and a failed page update leaves the tab
      // registered on its previous page.
    });
  } catch {
    // JSON.stringify or fetch throwing synchronously — still best-effort.
  }
}

function postResult({ basePath, requestId, result }) {
  postJson({ basePath, path: '', body: { requestId, result } });
}

function postTabPage({ basePath, tabId, page }) {
  postJson({
    basePath,
    path: '/page',
    body: {
      tabId,
      pageId: page.pageId,
      pathParams: page.pathParams,
      instanceKey: page.instanceKey,
    },
  });
}

// `page "ticket"`, or `page "ticket" (tickets/s/1)` for an instance of a page with placeholders,
// whose instance key ends in the path its values build.
function describePage({ pageId, instanceKey }) {
  const hashIndex = instanceKey.indexOf('#');
  if (hashIndex === -1) {
    return `page "${pageId}"`;
  }
  return `page "${pageId}" (${instanceKey.slice(hashIndex + 1)})`;
}

function requestedPage({ data, shownPage }) {
  if (type.isString(data.instanceKey)) {
    return { pageId: data.pageId, pathParams: data.pathParams, instanceKey: data.instanceKey };
  }
  return shownPage;
}

function findContext({ lowdefy, page }) {
  if (type.isNone(page)) {
    return { error: 'No page has rendered in this tab yet.' };
  }
  const context = lowdefy?.contexts?.[page.instanceKey];
  if (type.isNone(context)) {
    return { error: `No live context for ${describePage(page)}.` };
  }
  return { context };
}

function buildSnapshot({ lowdefy, page }) {
  const { context, error } = findContext({ lowdefy, page });
  if (error) {
    return { error };
  }
  return serializer.serializeToString({
    pageId: page.pageId,
    pathParams: context.pathParams,
    instanceKey: page.instanceKey,
    state: context.state,
    requests: context.requests,
    eventLog: (context.eventLog ?? []).slice(-50),
    global: lowdefy.lowdefyGlobal,
    user: lowdefy.user,
    input: lowdefy.inputs?.[page.instanceKey],
    urlQuery: window.location.search,
  });
}

function evalExpression({ lowdefy, page, expression }) {
  const { context, error } = findContext({ lowdefy, page });
  if (error) {
    return { error };
  }
  // Callers may pass the operator expression as a JSON-serializable object,
  // or (since it travels as a JSON string end-to-end from an MCP tool
  // argument) as a JSON string that needs one more parse.
  const input = type.isString(expression) ? JSON.parse(expression) : expression;
  // A read recorder set while the expression is parsed collects the keys its
  // operators read (the engine's block dependency tracking), e.g.
  // "state:customer.name". Mirrors evaluateInPage in inspectStateHeadless.js.
  const reads = new Set();
  const recordRead = (key) => {
    if (type.isString(key)) reads.add(key);
  };
  const ignore = () => {};
  const previousRecorder = context._internal.readRecorder;
  context._internal.readRecorder = {
    read: recordRead,
    engineRead: recordRead,
    pure: ignore,
    volatile: ignore,
    untracked: ignore,
  };
  let parsed;
  try {
    parsed = context._internal.parser.parse({ input, location: 'agent_eval' });
  } finally {
    context._internal.readRecorder = previousRecorder;
  }
  const { output, errors } = parsed;
  return {
    value: serializer.serializeToString(output),
    errors: errors.map((error) => error.message),
    reads: [...reads],
  };
}

const Inspector = ({ basePath, lowdefy, page }) => {
  const { source, tabId } = useContext(DevStreamContext);
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    if (type.isNone(source)) {
      return undefined;
    }

    const onInspectRequest = (message) => {
      let requestId;
      try {
        const data = JSON.parse(message.data);
        requestId = data.requestId;
        const result = buildSnapshot({
          lowdefy,
          page: requestedPage({ data, shownPage: pageRef.current }),
        });
        postResult({ basePath, requestId, result });
      } catch (error) {
        postResult({ basePath, requestId, result: { error: error.message } });
      }
    };

    const onEvalRequest = (message) => {
      let requestId;
      try {
        const data = JSON.parse(message.data);
        requestId = data.requestId;
        const result = evalExpression({
          lowdefy,
          page: requestedPage({ data, shownPage: pageRef.current }),
          expression: data.expression,
        });
        postResult({ basePath, requestId, result });
      } catch (error) {
        postResult({ basePath, requestId, result: { error: error.message } });
      }
    };

    source.addEventListener('inspect-request', onInspectRequest);
    source.addEventListener('eval-request', onEvalRequest);
    return () => {
      source.removeEventListener('inspect-request', onInspectRequest);
      source.removeEventListener('eval-request', onEvalRequest);
    };
  }, [basePath, lowdefy, source]);

  useEffect(() => {
    if (type.isNone(tabId) || type.isNone(page)) {
      return;
    }
    postTabPage({ basePath, tabId, page });
  }, [basePath, tabId, page]);

  return null;
};

export default Inspector;
