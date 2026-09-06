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
// pageId tracking: routes/reload.js registers every connection as an
// inspectable tab (lib/docs/tabChannel.js) and announces the tab id on the
// stream. This component then posts { tabId, pageId } to
// /api/dev-inspect/page whenever the developer navigates, so the registry's
// view of "what page is this tab on" stays current without reconnecting.
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

function postTabPage({ basePath, tabId, pageId }) {
  postJson({ basePath, path: '/page', body: { tabId, pageId } });
}

function buildSnapshot({ lowdefy, pageId }) {
  const context = lowdefy?.contexts?.[`page:${pageId}`];
  if (type.isNone(context)) {
    return { error: `No live context for page "${pageId}".` };
  }
  return serializer.serializeToString({
    pageId,
    state: context.state,
    requests: context.requests,
    eventLog: (context.eventLog ?? []).slice(-50),
    global: lowdefy.lowdefyGlobal,
    user: lowdefy.user,
    input: lowdefy.inputs?.[`page:${pageId}`],
    urlQuery: window.location.search,
  });
}

// Dev-only agent-state-xray: puts a human tester's real browser tab into a
// checkpoint's recorded state when it loads a page with `?_checkpoint=<name>`
// in the URL. Fetches the checkpoint's state part from
// GET <basePath>/api/dev-inspect/checkpoint/<name> (src/routes/devInspect.js
// — that fetch also loads the checkpoint's recorded requests into
// devMockRegistry server-side, so this tab's own requests replay recorded
// data), then injects state the same way e2e-utils' setState does:
// context._internal.State.set(...) + context._internal.update(). Polls
// briefly for the page context to exist since this can run before the page
// has finished mounting. Never lets a bad checkpoint or a missing context
// break the app — every step is try/catch, and failures just leave the app
// running unmodified.
async function bootstrapFromCheckpoint({ basePath, pageId, checkpointName, isCancelled }) {
  try {
    const response = await fetch(
      `${basePath}/api/dev-inspect/checkpoint/${encodeURIComponent(checkpointName)}`
    );
    const body = await response.json();
    if (!response.ok || body?.error) {
      // eslint-disable-next-line no-console
      console.error(
        `Failed to load checkpoint "${checkpointName}": ${body?.error ?? response.statusText}`
      );
      return;
    }
    const payload = serializer.deserialize(body);

    const deadline = Date.now() + 5000;
    let context;
    while (!isCancelled() && Date.now() < deadline) {
      context = window.lowdefy?.contexts?.[`page:${pageId}`];
      if (context) {
        break;
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (isCancelled() || type.isNone(context)) {
      return;
    }

    Object.entries(payload.state ?? {}).forEach(([key, value]) => {
      context._internal.State.set(key, value);
    });
    context._internal.update();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load checkpoint "${checkpointName}":`, error);
  }
}

function evalExpression({ lowdefy, pageId, expression }) {
  const context = lowdefy?.contexts?.[`page:${pageId}`];
  if (type.isNone(context)) {
    return { error: `No live context for page "${pageId}".` };
  }
  // Callers may pass the operator expression as a JSON-serializable object,
  // or (since it travels as a JSON string end-to-end from an MCP tool
  // argument) as a JSON string that needs one more parse.
  const input = type.isString(expression) ? JSON.parse(expression) : expression;
  const { output, errors } = context._internal.parser.parse({ input, location: 'agent_eval' });
  return {
    value: serializer.serializeToString(output),
    errors: errors.map((error) => error.message),
  };
}

const Inspector = ({ basePath, lowdefy, pageId }) => {
  const { source, tabId } = useContext(DevStreamContext);
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;

  useEffect(() => {
    if (type.isNone(source)) {
      return undefined;
    }

    const onInspectRequest = (message) => {
      let requestId;
      try {
        const data = JSON.parse(message.data);
        requestId = data.requestId;
        const targetPageId = data.pageId ?? pageIdRef.current;
        const result = buildSnapshot({ lowdefy, pageId: targetPageId });
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
        const targetPageId = data.pageId ?? pageIdRef.current;
        const result = evalExpression({
          lowdefy,
          pageId: targetPageId,
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
    if (type.isNone(tabId) || type.isNone(pageId)) {
      return;
    }
    postTabPage({ basePath, tabId, pageId });
  }, [basePath, tabId, pageId]);

  useEffect(() => {
    if (type.isNone(pageId)) {
      return undefined;
    }
    const checkpointName = new URLSearchParams(window.location.search).get('_checkpoint');
    if (type.isNone(checkpointName)) {
      return undefined;
    }

    let cancelled = false;
    bootstrapFromCheckpoint({
      basePath,
      pageId,
      checkpointName,
      isCancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [basePath, pageId]);

  return null;
};

export default Inspector;
