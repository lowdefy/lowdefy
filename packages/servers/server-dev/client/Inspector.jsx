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

import { useEffect, useRef } from 'react';

import { type, serializer } from '@lowdefy/helpers';

// Dev-only agent-state-xray channel — a sibling of Reload.jsx, but with its
// own /api/reload SSE connection (rather than reusing Reload's) so that
// connection can carry ?pageId=<pageId>. routes/reload.js only registers a
// connection as an inspectable tab (lib/docs/tabChannel.js) when that query
// param is present, which keeps Reload.jsx's plain reload/ping connection
// out of the tab registry entirely.
//
// pageId tracking: this effect depends on `pageId`, so React tears down and
// reopens the EventSource (a fresh connection, fresh tab id server-side)
// whenever the developer navigates to a different page — see the longer
// design note in src/routes/reload.js.
//
// Never let a bad payload or a plugin's operator error crash the app this is
// piggybacking on — every handler is wrapped, and the component itself
// always renders null.
function postResult({ basePath, requestId, result }) {
  try {
    fetch(`${basePath}/api/dev-inspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, result }),
    }).catch(() => {
      // Best-effort — a failed callback just leaves the agent's request to
      // time out server-side.
    });
  } catch {
    // JSON.stringify or fetch throwing synchronously — still best-effort.
  }
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
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;

  useEffect(() => {
    if (type.isNone(pageId)) {
      return undefined;
    }

    const sse = new EventSource(`${basePath}/api/reload?pageId=${encodeURIComponent(pageId)}`);

    sse.addEventListener('inspect-request', (message) => {
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
    });

    sse.addEventListener('eval-request', (message) => {
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
    });

    return () => {
      sse.close();
    };
  }, [basePath, lowdefy, pageId]);

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
