@ -0,0 +1,1468 @@

# Streams: First-Class Streaming Primitive for Lowdefy

Building on [ai-streaming-integration.md](./ai-streaming-integration.md) and [ai-streaming-option3-deep-dive.md](./ai-streaming-option3-deep-dive.md), this document defines **streams** as a new top-level concept in Lowdefy — parallel to requests, with their own config key, operator, plugins, and build pipeline.

**Base branch**: `develop` — this design builds on the error handling refactor (`@lowdefy/errors` with `ConfigError`/`PluginError`/`ServiceError`), `actionId` tracking in the engine, JIT page building, and the updated build validation patterns.

---

## Design Principles

1. **Streams are peers to requests, not a flag on requests.** They have their own `streams` key, `_stream` operator, and plugin resolver contract.
2. **Connections are shared.** Stream definitions reference the same `connections` key. A connection to OpenAI is used by both non-streaming requests and streaming streams.
3. **Event-driven invocation.** Streams are triggered by actions in events (onClick, onEnter, etc.) via a new `Stream` action — just like `Request` triggers requests.
4. **Payload/properties split.** Like requests: `payload` is evaluated client-side (operators like `_state`), `properties` is evaluated server-side (operators like `_secret`, `_payload`).
5. **Stream resolvers are plugins.** Registered on connections alongside request resolvers. Same build-time discovery, same runtime resolution pattern.
6. **Configurable rendering.** Throttle interval and update behavior are configurable on the stream definition.

---

## YAML Config Shape

### Full Example

```yaml
connections:
  - id: openai
    type: OpenAIChat
    properties:
      apiKey:
        _secret: OPENAI_API_KEY
      model: gpt-4o
      read: true
      write: false

pages:
  - id: chat
    streams:
      - id: askAI
        type: OpenAIChatStream
        connectionId: openai
        payload:
          messages:
            _state: chatMessages
        properties:
          model: gpt-4o
          temperature: 0.7
          maxTokens: 2048
          messages:
            _payload: messages
        client:
          throttleRender: 500 # ms between UI updates (default: 500, min: 100)

    blocks:
      - id: chatInput
        type: TextArea
        properties:
          placeholder: 'Ask a question...'

      - id: sendButton
        type: Button
        properties:
          title: Send
        events:
          onClick:
            # 1. Append user message to chatMessages state
            - id: append_user_message
              type: SetState
              params:
                chatMessages:
                  _array.concat:
                    - _state: chatMessages
                    - - role: user
                        content:
                          _state: chatInput
            # 2. Clear input
            - id: clear_input
              type: SetState
              params:
                chatInput: ''
            # 3. Start the stream (payload reads updated chatMessages)
            - id: start_stream
              type: Stream
              params: askAI
            # 4. After stream completes, append assistant response to history
            - id: append_assistant_message
              type: SetState
              params:
                chatMessages:
                  _array.concat:
                    - _state: chatMessages
                    - - role: assistant
                        content:
                          _array.join:
                            on:
                              _stream: askAI.response.data
                            separator: ''

      - id: stopButton
        type: Button
        properties:
          title: Stop
        visible:
          _stream: askAI.loading
        events:
          onClick:
            - id: cancel
              type: CancelStream
              params: askAI

      - id: response
        type: Markdown
        properties:
          content:
            _array.join:
              on:
                _stream: askAI.response.data
              separator: ''

      - id: tokenCount
        type: Html
        visible:
          _not:
            _stream: askAI.loading
        properties:
          html:
            _string:
              - 'Tokens: '
              - _stream: askAI.response.usage.completionTokens
```

**How the message flow works:**

1. User types in `chatInput` → state has `chatInput: "What is Lowdefy?"`
2. User clicks Send → `onClick` event fires sequentially:
   - `append_user_message`: pushes `{ role: 'user', content: '...' }` onto `chatMessages` array in state
   - `clear_input`: resets the text area
   - `start_stream`: triggers the `askAI` stream — payload reads `chatMessages` from state (now includes the new user message), sends it to the server. Server evaluates `_payload: messages` in properties, passes the full message array to the OpenAI resolver.
   - `append_assistant_message`: after the stream completes, appends `{ role: 'assistant', content: '...' }` to `chatMessages` by joining the string deltas in `_stream: askAI.response.data` to get the final accumulated response.
3. Next message: `chatMessages` now has the full conversation history, so the next stream sends everything.

### Stream Definition Schema

```yaml
streams:
  - id: string # Required. Unique stream identifier.
    type: string # Required. Stream resolver type (from plugin).
    connectionId: string # Required. References a connection definition.
    payload: object # Client-side operators (_state, _event, _if, etc.)
    properties: object # Server-side operators (_secret, _user, _payload, etc.)
    client:
      throttleRender: number # Optional. ms between UI updates. Default: 500. Min: 100.
```

### `_stream` Operator

Access the most recent stream invocation's state from any block property. Always reads from `context.streams[streamId][0]` (same pattern as `_request` reading from `context.requests[requestId][0]`). Uses `get()` from `@lowdefy/helpers` internally for dot-path resolution, supporting numeric array indices and `$` for List block array context (same as `_state`).

**Key differences from `_request`:**

- **No loading gate.** `_request` returns `null` while the request is loading. `_stream` returns the current value regardless of loading state — this is essential because `response.data` grows progressively during streaming and must be readable while `loading` is `true`.
- **Accesses full stream entry.** `_request` navigates into `.response` automatically (`_request: myReq.0.a` reads `requests.myReq[0].response.0.a`). `_stream` navigates from the stream entry root (`_stream: askAI.response.data` reads `streams.askAI[0].response.data`, `_stream: askAI.loading` reads `streams.askAI[0].loading`).
- **Null-safe for `streams` context.** Returns `null` if `context.streams` is not yet initialized (backward compatibility before streaming feature is fully wired up).

```yaml
# Common fields
_stream: askAI.loading                    # boolean — true while streaming
_stream: askAI.error                      # object — error details if stream failed

# Response fields (available during and after streaming)
_stream: askAI.response.data              # array — all deserialized chunk payloads (grows during stream)
_stream: askAI.response.data.0.name       # access fields on individual chunks (numeric index)
_stream: askAI.response.data.$.field      # array context in List blocks ($ resolved by arrayIndices)
_stream: askAI.response.usage             # object — { promptTokens, completionTokens } (set on complete)
_stream: askAI.response.finishReason      # string — 'stop', 'cancelled', 'error' (set on complete)
```

**`response.data`**: An array that grows during streaming. Each `onChunk({ data })` call pushes the deserialized value onto the array. AI text resolvers send string deltas (`onChunk({ data: "Hello" })`), document resolvers send objects (`onChunk({ data: { name: "Alice" } })`). The data type is determined by the resolver — the framework just accumulates.

### `_stream_details` Operator

Access stream history and metadata, parallel to `_request_details`. Reads from the full `context.streams` object, so you can access previous invocations and metadata fields not exposed by `_stream`:

```yaml
# Most recent invocation (same as _stream)
_stream_details: askAI.0.response.data       # [0] = most recent
_stream_details: askAI.0.loading

# Previous invocations
_stream_details: askAI.1.response.data       # [1] = previous invocation

# Metadata fields
_stream_details: askAI.0.payload             # evaluated payload sent with stream
_stream_details: askAI.0.responseTime        # ms from start to completion
_stream_details: askAI.0.actionId            # action that triggered this invocation
```

### Actions

**`Stream`** — Start a stream (like `Request` starts a request):

```yaml
events:
  onClick:
    - id: start
      type: Stream
      params: askAI # stream id
```

Fire-and-forget using the existing `async` property on actions:

```yaml
events:
  onClick:
    - id: start
      type: Stream
      async: true # fire-and-forget — action resolves immediately, stream runs in background
      params: askAI
    - id: do_something_else
      type: SetState # runs immediately, doesn't wait for stream to complete
      params:
        status: streaming
```

**Behavior:**

- **Default (blocking)**: The `Stream` action resolves when the stream completes. Subsequent actions in the chain run after. Matches `Request` action behavior.
- **`async: true`**: Uses the existing Lowdefy action `async` property. The action resolves immediately; the stream runs in the background. Errors are logged but don't stop the chain.
- **Re-invocation**: If the stream is already active, it is automatically cancelled and restarted. State is reset before the new stream begins.
- **Cancellation**: If a blocking `Stream` action is cancelled (via `CancelStream` from another event), the action rejects. Subsequent actions in the chain do not run. `response.finishReason` is set to `'cancelled'` and any accumulated `response.data` is preserved (partial result).

**`CancelStream`** — Abort an active stream:

```yaml
events:
  onClick:
    - id: stop
      type: CancelStream
      params: askAI # stream id
```

---

## Client-Side State Model

Each stream gets its own entry in `context.streams`, initialized when the Context class is constructed (parallel to how `context.requests` is populated from `rootBlock.requests`). The `Streams` class reads stream config from `this.context._internal.rootBlock.streams` and sets up the config map and initial state.

Streams maintain a history array just like requests — each invocation is `unshift`ed to the front, so `[0]` is always the most recent. This enables `_stream_details` to access previous invocations and metadata (same pattern as `_request_details`):

```javascript
context.streams = {
  askAI: [
    // [0] = most recent invocation
    {
      actionId: null, // Tracks which action triggered this stream (for error tracing)
      loading: false,
      payload: null, // Evaluated payload sent with stream
      response: {
        data: [], // Array of deserialized chunk payloads (grows during stream)
        usage: null, // { promptTokens, completionTokens } — set on complete
        finishReason: null, // 'stop' | 'cancelled' | 'error' — set on complete
      },
      error: null,
      responseTime: null, // ms from start to completion
      streamId: 'askAI',
    },
    // [1] = previous invocation, etc.
  ],
};
// Internal runtime properties (not exposed via _stream/_stream_details):
// - abortController: AbortController instance, set during active streaming,
//   deleted on completion. Stored on the stream object for cancel+restart
//   but excluded from operator access.
```

Multiple streams can run concurrently on the same page (e.g., an AI chat stream and a MongoDB aggregation stream at the same time). Each stream has independent state.

**Chunk accumulation**: When a chunk arrives from the server, the framework deserializes it (preserving Date, ObjectId, etc. via `serializer.deserialize`), then pushes the deserialized `data` value onto `response.data`. All resolvers use `onChunk({ data })` — AI text resolvers send string deltas, document resolvers send objects.

**Note on memory**: `response.data` grows without bound during streaming. For long-running streams (large MongoDB aggregations, very long AI responses), the array can become large. Combined with the history pattern (previous invocations retained), this may consume significant memory on long-lived pages. This is consistent with how `context.requests` works — request history is also unbounded. Consider documenting chunk size guidance for plugin authors and, if needed, adding a `client.maxDataEntries` option in a future phase.

### Throttled Updates

Chunks are buffered and flushed at the configured `throttleRender` interval (default 500ms):

```javascript
// Pseudocode for Streams.fetchStream()
// Follows same actionId threading pattern as Requests.fetch()
async fetchStream(streamDef, { actions, actionId, arrayIndices, event }) {
  const streamHistory = this.context.streams[streamDef.streamId];

  // Cancel + restart: if the most recent invocation is still active, abort it first
  if (streamHistory[0]?.loading && streamHistory[0]?.abortController) {
    streamHistory[0].abortController.abort();
  }

  // Evaluate payload operators (same as Requests.callRequest)
  const { output: payload, errors: parserErrors } = this.context._internal.parser.parse({
    actions,
    event,
    arrayIndices,
    input: streamDef.payload,
    location: streamDef.streamId,
  });
  if (parserErrors.length > 0) {
    throw parserErrors[0];
  }

  // Create new stream entry and unshift to history (same pattern as Requests)
  const stream = {
    actionId,
    loading: true,
    payload,
    response: { data: [], usage: null, finishReason: null },
    error: null,
    responseTime: null,
    streamId: streamDef.streamId,
  };
  streamHistory.unshift(stream);

  // Per-run token: prevents stale writes from a previous run's catch/finally
  // blocks after cancel+restart. All state writes check this before proceeding.
  const runId = actionId;
  const isCurrentRun = () => streamHistory[0]?.actionId === runId;

  this.context._internal.update();

  const abortController = new AbortController();
  stream.abortController = abortController;
  const startTime = Date.now();

  // Matches request pattern: engine serializes payload, fetch layer stringifies body
  const serializedPayload = serializer.serialize(payload);
  const fetchResponse = await this.context._internal.lowdefy._internal.callStream({
    actionId,
    pageId: this.context.pageId,
    streamId: streamDef.streamId,
    payload: serializedPayload,
    signal: abortController.signal,
  });
  // callStream internally does:
  //   fetch(url, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ payload }),
  //     signal,
  //   })
  // Returns the raw Response (not parsed) so we can read the stream

  // Guard: validate response before opening stream reader.
  // Pre-SSE failures (401, 403, 500) return JSON, not SSE.
  if (!fetchResponse.ok || !fetchResponse.headers.get('content-type')?.includes('text/event-stream')) {
    const errorBody = await fetchResponse.json().catch(() => ({}));
    throw new Error(errorBody.message ?? `Stream request failed: ${fetchResponse.status}`);
  }

  const reader = fetchResponse.body.getReader();
  const decoder = new TextDecoder();
  const throttleMs = Math.max((streamDef.client?.throttleRender ?? 500), 100);

  let dataBuffer = [];
  let dirty = false;
  let flushTimer = null;
  let lineBuffer = ''; // Accumulates partial lines across reader.read() chunks
  const MAX_LINE_BUFFER = 15 * 1024 * 1024; // 15MB guard against malformed streams

  // Note: on cancel+restart, the previous run's flushTimer may still be pending.
  // It's a local variable in the previous call's scope and can't be cleared from here.
  // The isCurrentRun() guard ensures it returns early without writing stale data.
  const flush = () => {
    if (!isCurrentRun()) return; // Stale run — discard
    if (dirty) {
      stream.response.data.push(...dataBuffer);
      dataBuffer = [];
      dirty = false;
      this.context._internal.update();
    }
    flushTimer = null;
  };

  const scheduleFlush = () => {
    if (!flushTimer) {
      flushTimer = setTimeout(flush, throttleMs);
    }
  };

  // Process a complete SSE line
  const processLine = (line) => {
    if (!line.startsWith('data: ')) return;
    const raw = line.slice(6);
    if (raw === '[DONE]') return;

    const chunk = JSON.parse(raw);
    if (chunk.type === 'chunk') {
      // Deserialize chunk payload (preserves Date, ObjectId, etc.)
      const deserialized = serializer.deserialize(chunk.payload);
      dataBuffer.push(deserialized.data);
      dirty = true;
      scheduleFlush();
    } else if (chunk.type === 'complete') {
      flush();
      if (isCurrentRun()) {
        const meta = serializer.deserialize(chunk.payload);
        stream.response.usage = meta.usage;
        stream.response.finishReason = meta.finishReason;
      }
    } else if (chunk.type === 'error') {
      throw new Error(chunk.message);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Accumulate into line buffer, then split on newlines.
      // SSE events can be split across reader.read() chunks at arbitrary
      // byte boundaries, so we must buffer incomplete lines.
      lineBuffer += decoder.decode(value, { stream: true });
      if (lineBuffer.length > MAX_LINE_BUFFER) {
        throw new Error('Stream line buffer exceeded maximum size.');
      }
      const lines = lineBuffer.split('\n');
      // Last element is either '' (line was complete) or a partial line
      lineBuffer = lines.pop();
      for (const line of lines) {
        processLine(line);
      }
    }
    // Flush any remaining bytes from TextDecoder (multibyte edge case)
    lineBuffer += decoder.decode();
    if (lineBuffer) {
      processLine(lineBuffer);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      stream.response.finishReason = 'cancelled';
    } else {
      stream.error = error;
      stream.response.finishReason = 'error';
    }
  } finally {
    // Release the reader to free the underlying connection.
    // For AbortError the browser cleans up, but for other errors
    // (JSON parse, SSE error event) the reader may still be locked.
    try { reader.cancel(); } catch (_) { /* already closed */ }
  }

  // Clean up stream-local state regardless of whether this is the current run.
  // On cancel+restart, the new run has already unshifted a new entry, so this
  // stream object is now at streamHistory[1+]. We still need correct state on
  // historical entries (loading: false, finishReason set, no abortController).
  if (flushTimer) clearTimeout(flushTimer);
  if (dirty) {
    stream.response.data.push(...dataBuffer);
  }
  stream.loading = false;
  stream.responseTime = Date.now() - startTime;
  delete stream.abortController;

  // Only trigger framework side-effects (re-render, error propagation) for
  // the current run. Stale runs must not call update() or throw errors that
  // could interfere with the active run.
  if (!isCurrentRun()) return;

  this.context._internal.update();

  // If cancelled or errored, rethrow so blocking Stream action rejects
  // (stops subsequent actions in the chain). Partial results are preserved in state.
  if (stream.response.finishReason === 'cancelled') {
    const cancelError = new Error('Stream cancelled.');
    cancelError.name = 'StreamCancelledError';
    throw cancelError;
  }
  if (stream.error) {
    throw stream.error;
  }
}
```

---

## Server-Side Pipeline

### New API Route

`/api/stream/[pageId]/[streamId]` — dedicated route for streaming, parallel to `/api/request/[pageId]/[requestId]`.

### Pipeline Steps

The stream pipeline mirrors the request pipeline. Steps 1–7 are reused via shared preparation logic extracted from the request pipeline:

1. **Context setup** — deserialize payload, set pageId/streamId
2. **Load stream config** — from `build/pages/{pageId}/streams/{streamId}.json`
3. **Load connection config** — from `build/connections/{connectionId}.json`
4. **Authorization** — role-based access check
5. **Connection & resolver lookup** — `connections[type].streams[streamType]`
6. **Operator evaluation** — server-side operators on connection and stream properties
7. **Permission checks** — read/write on connection
8. **Schema validation** — connection + stream properties against schemas
9. **Streaming execution** — call resolver with `onChunk` callback, stream SSE to client

### Server Route Handler

```javascript
import { ConfigError, PluginError, ServiceError } from '@lowdefy/errors/server';
import { serializer } from '@lowdefy/helpers';

async function handler({ context, req, res }) {
  const { logger } = context;
  const { pageId, streamId } = req.query;
  const { payload } = req.body;

  // Steps 1–8: shared with request pipeline.
  // prepareStream is extracted from the existing callRequest.js during implementation —
  // the shared logic (config loading, auth, operator evaluation, schema validation) is
  // factored into a common prepare function, with callRequest and callStream each calling
  // it with their respective config paths (requests/ vs streams/).
  const prepared = await prepareStream(context, { pageId, streamId, payload });
  const { streamConfig, streamResolver, connectionProperties, streamProperties } = prepared;

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Abort on client disconnect
  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  // Framework owns serialization: plugins call onChunk({ data }) with raw values,
  // the wrapper serializes before writing to the SSE stream.
  // Plugins MAY pre-process provider-specific types (e.g., MongoDB ObjectId → _oid)
  // using their own serialize utilities before calling onChunk. The framework
  // serializer then handles standard type markers (~d for Date, ~e for Error).
  function onChunk({ data }) {
    if (!abortController.signal.aborted) {
      const serialized = serializer.serialize({ data });
      res.write(`data: ${JSON.stringify({ type: 'chunk', payload: serialized })}\n\n`);
    }
  }

  try {
    const metadata = await streamResolver({
      connection: connectionProperties,
      request: streamProperties,
      payload: context.payload,
      onChunk,
      signal: abortController.signal,
    });

    if (!abortController.signal.aborted) {
      const serialized = serializer.serialize(metadata ?? {});
      res.write(`data: ${JSON.stringify({ type: 'complete', payload: serialized })}\n\n`);
    }
  } catch (error) {
    // Follow callRequestResolver.js error wrapping pattern:
    // 1. Attach configKey for location tracing
    if (!error.configKey) {
      error.configKey = streamConfig['~k'];
    }
    // 2. ConfigError passes through as-is
    // 3. Service errors (network, timeout) wrapped in ServiceError
    // 4. Everything else wrapped in PluginError
    let wrappedError;
    if (error instanceof ConfigError) {
      wrappedError = error;
    } else if (ServiceError.isServiceError(error)) {
      wrappedError = new ServiceError({
        error,
        service: streamConfig.connectionId,
        configKey: streamConfig['~k'],
      });
    } else {
      wrappedError = new PluginError({
        error,
        pluginType: 'stream',
        pluginName: streamConfig.type,
        received: streamProperties,
        location: `${streamConfig.connectionId}/${streamConfig.streamId}`,
        configKey: streamConfig['~k'],
      });
    }

    if (!abortController.signal.aborted) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: wrappedError.message })}\n\n`);
    }
    logger.debug({ err: wrappedError }, wrappedError.message);
    // Do NOT re-throw: headers are already sent (200 + SSE), so apiWrapper
    // cannot send an HTTP error response. Errors are communicated via SSE events.
  }

  res.end();
}

export default apiWrapper(handler);
```

---

## Plugin Contract

### Connection Plugin Structure (Extended)

Connections gain a `streams` map alongside the existing `requests` map:

```javascript
// connection-openai/src/connections/OpenAIChat/OpenAIChat.js
import OpenAIChatCompletion from './OpenAIChatCompletion/OpenAIChatCompletion.js';
import OpenAIChatStream from './OpenAIChatStream/OpenAIChatStream.js';

export default {
  schema: connectionSchema,
  requests: {
    OpenAIChatCompletion, // Non-streaming (existing pattern)
  },
  streams: {
    OpenAIChatStream, // Streaming (new)
  },
};
```

### Stream Resolver Contract

```javascript
async function OpenAIChatStream({ request, connection, onChunk, signal }) {
  // Resolvers must propagate abort signal to provider calls where supported.
  // stream_options.include_usage is required to get token usage in streaming mode —
  // OpenAI only sends usage in the final chunk when this option is set.
  const stream = await openai.chat.completions.create(
    {
      model: request.model ?? connection.model,
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: true,
      stream_options: { include_usage: true },
    },
    { signal }
  );

  // Collect metadata from chunks during iteration.
  // OpenAI streaming sends usage in the final chunk and finishReason per-choice.
  let usage = null;
  let finishReason = 'stop';

  for await (const chunk of stream) {
    if (signal?.aborted) break;

    const choice = chunk.choices[0];
    if (choice?.delta?.content) {
      onChunk({ data: choice.delta.content });
    }
    if (choice?.finish_reason) {
      finishReason = choice.finish_reason;
    }
    if (chunk.usage) {
      usage = {
        promptTokens: chunk.usage.prompt_tokens,
        completionTokens: chunk.usage.completion_tokens,
      };
    }
  }

  return { usage, finishReason };
}

OpenAIChatStream.schema = streamRequestSchema;
OpenAIChatStream.meta = {
  checkRead: true,
  checkWrite: false,
};

export default OpenAIChatStream;
```

### Resolver Parameters

| Parameter    | Type          | Description                                                                                                                                                        |
| ------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `connection` | `object`      | Evaluated connection properties (with `_secret` resolved)                                                                                                          |
| `request`    | `object`      | Evaluated stream properties (with `_payload`, `_user` resolved)                                                                                                    |
| `payload`    | `object`      | Raw deserialized client payload                                                                                                                                    |
| `onChunk`    | `function`    | Call with `{ data }`. Value can be any type (string, object, etc.). May pre-process provider types (e.g., ObjectId → `_oid`). Framework serializes standard types. |
| `signal`     | `AbortSignal` | Abort signal — must propagate to provider calls where supported                                                                                                    |

### Return Value

The resolver returns metadata sent as the `complete` event:

```javascript
return {
  usage: { promptTokens: number, completionTokens: number },
  finishReason: 'stop' | 'length' | 'tool_calls' | string,
  // Any additional metadata the plugin wants to expose
};
```

### types.js Extension

Plugin `types.js` adds a `streams` key:

```javascript
import * as connections from './connections.js';

export default {
  connections: Object.keys(connections),
  requests: Object.keys(connections)
    .map((c) => Object.keys(connections[c].requests ?? {}))
    .flat(),
  streams: Object.keys(connections)
    .map((c) => Object.keys(connections[c].streams ?? {}))
    .flat(),
};
```

---

## Build Pipeline Changes

Build does the work, runtime stays simple: stream definitions are validated, defaults are set, and artifacts are always written during build. Runtime should never need existence checks or fallback defaults for stream artifacts.

### New Build Steps

| Step              | File                                    | Change                                                           |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Schema            | `lowdefySchema.js`                      | Add `streams` array to page schema                               |
| Build streams     | `buildPages/buildBlock/buildStreams.js` | New — validate stream definitions, set defaults                  |
| Write streams     | `writeStreams.js`                       | New — write `build/pages/{pageId}/streams/{streamId}.json`       |
| Type counting     | `buildTypes.js`                         | Count stream types alongside request types                       |
| Type map          | `createPluginTypesMap.js`               | Map `streams` from plugin `types.js`                             |
| Import generation | `buildImports/`                         | Generate `build/plugins/streams.js` (or extend `connections.js`) |
| Plugin imports    | `writePluginImports/`                   | Write stream resolver imports                                    |
| Event validation  | `buildPages/buildBlock/buildEvents.js`  | Collect `Stream`/`CancelStream` action refs, validate stream IDs |

### Build Validation (follows `buildRequests.js` pattern)

```javascript
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors/build';

function buildStream(stream, pageContext) {
  const { auth, checkDuplicateStreamId, context, pageId, typeCounters } = pageContext;
  const configKey = stream['~k'];

  if (type.isUndefined(stream.id)) {
    throw new ConfigError({
      message: `Stream id missing at page "${pageId}".`,
      configKey,
      context,
    });
  }
  if (!type.isString(stream.id)) {
    throw new ConfigError({
      message: `Stream id is not a string at page "${pageId}".`,
      received: stream.id,
      configKey,
      context,
    });
  }
  checkDuplicateStreamId(stream);

  // Stream and request IDs must be unique across both types on the same page
  if (pageContext.requestIds.has(stream.id)) {
    throw new ConfigError({
      message: `Stream "${stream.id}" at page "${pageId}" has the same id as a request.`,
      configKey,
      context,
    });
  }

  // connectionId is required for streams
  if (type.isNone(stream.connectionId)) {
    throw new ConfigError({
      message: `Stream "${stream.id}" at page "${pageId}" connectionId is missing.`,
      configKey,
      context,
    });
  }
  if (!type.isString(stream.connectionId)) {
    throw new ConfigError({
      message: `Stream "${stream.id}" at page "${pageId}" connectionId is not a string.`,
      received: stream.connectionId,
      configKey,
      context,
    });
  }
  if (!context.connectionIds.has(stream.connectionId)) {
    throw new ConfigError({
      message: `Stream "${stream.id}" at page "${pageId}" references non-existent connection "${stream.connectionId}".`,
      configKey,
      context,
      checkSlug: 'connection-refs',
    });
  }

  // Set defaults (use type.isNone to catch both null and undefined)
  if (type.isNone(stream.payload)) stream.payload = {};
  if (type.isNone(stream.client)) stream.client = {};
  if (type.isNone(stream.client.throttleRender)) stream.client.throttleRender = 500;

  stream.auth = auth;
  stream.streamId = stream.id;
  stream.pageId = pageId;
  stream.id = `stream:${pageId}:${stream.id}`;
  pageContext.streams.push(stream);
}
```

### JIT Build Compatibility

Stream definitions are page-level artifacts that fit into JIT page building, but the current JIT pipeline is request-centric and requires explicit stream support in four seams:

| File                                                 | Change                                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `packages/build/src/build/jit/shallowBuild.js`       | Add `pages.*.streams` to shallow stop paths                                           |
| `packages/build/src/build/jit/createPageRegistry.js` | Include `streams` in raw page content alongside `blocks/areas/events/requests/layout` |
| `packages/build/src/build/jit/buildPageJit.js`       | Extract, delete, and write `streams` alongside `requests`                             |
| `packages/build/src/build/jit/writePageJit.js`       | Write stream artifacts alongside request artifacts                                    |

In dev mode, when a page is requested, `buildPageJit` resolves the full page including its streams. File watcher invalidation covers stream definition changes through the existing page cache mechanism.

### Build Artifact Structure

```
build/
├── connections/
│   └── openai.json
├── pages/
│   └── chat/
│       ├── requests/
│       │   └── ...
│       └── streams/               # New
│           └── askAI.json
└── plugins/
    ├── connections.js             # Existing — also used for stream resolver lookup
    └── ...
```

### Stream Build Artifact (`askAI.json`)

```json
{
  "id": "stream:chat:askAI",
  "streamId": "askAI",
  "pageId": "chat",
  "type": "OpenAIChatStream",
  "connectionId": "openai",
  "payload": {
    "messages": { "_state": "chatMessages" }
  },
  "properties": {
    "model": "gpt-4o",
    "temperature": 0.7,
    "maxTokens": 2048,
    "messages": { "_payload": "messages" }
  },
  "auth": { "public": true },
  "client": {
    "throttleRender": 500
  }
}
```

---

## Example: MongoDB Aggregation Stream

This demonstrates that streams aren't just for AI text — they handle any data type with full serialization. A MongoDB aggregation pipeline can stream documents to the client as they're processed, preserving Date, ObjectId, and other types.

### YAML Config

```yaml
connections:
  - id: mongodb
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: orders
      read: true

pages:
  - id: reports
    streams:
      - id: orderAggregation
        type: MongoDBCollectionAggregateStream
        connectionId: mongodb
        payload:
          startDate:
            _state: filterStartDate
          endDate:
            _state: filterEndDate
        properties:
          pipeline:
            - $match:
                createdAt:
                  $gte:
                    _payload: startDate
                  $lte:
                    _payload: endDate
            - $group:
                _id: $category
                totalRevenue:
                  $sum: $amount
                orderCount:
                  $sum: 1
                avgOrderValue:
                  $avg: $amount
                lastOrderDate:
                  $max: $createdAt
            - $sort:
                totalRevenue: -1
        client:
          throttleRender: 200

    blocks:
      - id: dateRange
        type: DateRangeSelector
        properties:
          startDate:
            _state: filterStartDate
          endDate:
            _state: filterEndDate

      - id: runReport
        type: Button
        properties:
          title: Run Report
        events:
          onClick:
            - id: run
              type: Stream
              params: orderAggregation

      - id: stopReport
        type: Button
        properties:
          title: Stop
        visible:
          _stream: orderAggregation.loading
        events:
          onClick:
            - id: cancel
              type: CancelStream
              params: orderAggregation

      - id: resultsCount
        type: Html
        properties:
          html:
            _string:
              - 'Categories loaded: '
              - _array.length:
                  _stream: orderAggregation.response.data

      - id: resultsTable
        type: AgGridAlpine
        properties:
          rowData:
            _stream: orderAggregation.response.data
          columnDefs:
            - headerName: Category
              field: _id
            - headerName: Revenue
              field: totalRevenue
              valueFormatter: currency
            - headerName: Orders
              field: orderCount
            - headerName: Avg Order
              field: avgOrderValue
              valueFormatter: currency
            - headerName: Last Order
              field: lastOrderDate
              valueFormatter: date
```

### Stream Resolver Plugin

```javascript
// connection-mongodb/src/connections/MongoDBCollection/MongoDBCollectionAggregateStream.js

import getCollection from '../getCollection.js';
import { serialize, deserialize } from '../serialize.js';

async function MongoDBCollectionAggregateStream({ request, connection, onChunk, signal }) {
  const deserializedRequest = deserialize(request);
  const { pipeline, options } = deserializedRequest;

  const { collection, client } = await getCollection({ connection });

  let documentCount = 0;

  try {
    const cursor = collection.aggregate(pipeline, options);

    for await (const document of cursor) {
      if (signal?.aborted) break;

      // Pre-process MongoDB types (ObjectId → _oid) using plugin's serialize utility.
      // Framework's onChunk wrapper then handles standard types (~d for Date, ~e for Error).
      // Same two-layer pattern as request resolvers.
      onChunk({ data: serialize(document) });
      documentCount++;
    }
  } finally {
    await client.close();
  }

  return {
    finishReason: signal?.aborted ? 'cancelled' : 'stop',
    documentCount,
  };
}

MongoDBCollectionAggregateStream.schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['pipeline'],
  properties: {
    pipeline: {
      type: 'array',
      description: 'MongoDB aggregation pipeline stages.',
    },
    options: {
      type: 'object',
      description: 'Aggregation options (e.g., allowDiskUse).',
    },
  },
};

MongoDBCollectionAggregateStream.meta = {
  checkRead: true,
  checkWrite: false,
};

export default MongoDBCollectionAggregateStream;
```

### Connection Plugin Structure

```javascript
// connection-mongodb/src/connections/MongoDBCollection/MongoDBCollection.js
import MongoDBFind from './MongoDBFind/MongoDBFind.js';
import MongoDBInsertOne from './MongoDBInsertOne/MongoDBInsertOne.js';
import MongoDBAggregate from './MongoDBAggregate/MongoDBAggregate.js';
import MongoDBCollectionAggregateStream from './MongoDBCollectionAggregateStream/MongoDBCollectionAggregateStream.js';
// ... other imports

export default {
  schema: connectionSchema,
  requests: {
    MongoDBFind,
    MongoDBInsertOne,
    MongoDBAggregate, // Non-streaming: returns complete result array
    // ... other request resolvers
  },
  streams: {
    MongoDBCollectionAggregateStream, // Streaming: yields documents one by one
  },
};
```

### What Goes Over the Wire

Each document is serialized on the server, preserving MongoDB types:

```
data: {"type":"chunk","payload":{"data":{"_id":"Electronics","totalRevenue":152430.50,"orderCount":342,"avgOrderValue":445.70,"lastOrderDate":{"~d":"2024-02-10T14:30:00.000Z"}}}}\n\n
data: {"type":"chunk","payload":{"data":{"_id":"Clothing","totalRevenue":98210.25,"orderCount":567,"avgOrderValue":173.21,"lastOrderDate":{"~d":"2024-02-11T09:15:00.000Z"}}}}\n\n
data: {"type":"chunk","payload":{"data":{"_id":"Books","totalRevenue":45100.00,"orderCount":890,"avgOrderValue":50.67,"lastOrderDate":{"~d":"2024-02-12T16:45:00.000Z"}}}}\n\n
data: {"type":"complete","payload":{"finishReason":"stop","documentCount":3}}\n\n
```

On the client, `serializer.deserialize` reconstructs the proper types:

- `lastOrderDate` becomes a `Date` object
- Numbers are plain JSON numbers (no special marker needed)
- `_id` (if ObjectId) would use `{"_oid":"..."}` via a custom reviver on the MongoDB plugin

The table block's `rowData` binds to `_stream: orderAggregation.response.data`, which grows as documents arrive — the table progressively fills in during streaming.

---

## Transport Protocol

### Framework Level: Lowdefy SSE

The framework owns a simple, stable SSE transport with three event types. This is **not a choice between SSE and AI SDK** — the framework always uses Lowdefy SSE. The AI SDK is a plugin implementation detail (see below).

```
// AI text streaming (data is a string delta):
data: {"type":"chunk","payload":{"data":"Hello"}}\n\n
data: {"type":"chunk","payload":{"data":" world"}}\n\n
data: {"type":"complete","payload":{"usage":{"promptTokens":10,"completionTokens":5},"finishReason":"stop"}}\n\n

// MongoDB document streaming (data is an object, serializer.serialize'd to preserve types):
data: {"type":"chunk","payload":{"data":{"name":"Alice","createdAt":{"~d":"2024-01-15T00:00:00.000Z"},"_id":{"_oid":"507f1f77bcf86cd799439011"}}}}\n\n
data: {"type":"chunk","payload":{"data":{"name":"Bob","createdAt":{"~d":"2024-02-20T00:00:00.000Z"}}}}\n\n
data: {"type":"complete","payload":{"finishReason":"stop"}}\n\n
```

**Wire format**: Standard SSE (`Content-Type: text/event-stream`). Each `data:` line contains a JSON object with a `type` field and a `payload` field. The payload is serialized via `serializer.serialize` on the server and deserialized via `serializer.deserialize` on the client, preserving types like Date, Error, and MongoDB ObjectId.

**Event types**:

| Type       | Payload                                     | Description                  |
| ---------- | ------------------------------------------- | ---------------------------- |
| `chunk`    | `{ data }` (serialized)                     | Delta from resolver          |
| `complete` | `{ usage, finishReason, ... }` (serialized) | Stream finished successfully |
| `error`    | N/A — `message` field at top level          | Stream failed                |

**Headers**:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

**Client parsing** (with line buffer for safe chunk boundary handling):

```javascript
// Accumulate partial lines across reader.read() chunks
lineBuffer += decoder.decode(value, { stream: true });
const lines = lineBuffer.split('\n');
lineBuffer = lines.pop(); // Keep incomplete trailing line

for (const line of lines) {
  if (!line.startsWith('data: ')) continue;
  const chunk = JSON.parse(line.slice(6));
  switch (chunk.type) {
    case 'chunk': {
      const deserialized = serializer.deserialize(chunk.payload);
      dataBuffer.push(deserialized.data);
      break;
    }
    case 'complete': {
      const meta = serializer.deserialize(chunk.payload);
      /* set usage, finishReason from meta */
      break;
    }
    case 'error':
      /* throw */ break;
  }
}
```

**Serialization ownership (two-layer pattern, same as requests):**

1. **Plugin layer**: Plugins MAY pre-process provider-specific types before calling `onChunk({ data })`. For example, the MongoDB plugin converts ObjectId instances to `{ _oid: "hex" }` markers using its own serialize utility. This is type conversion, not full serialization.
2. **Framework layer**: The server route's `onChunk` wrapper calls `serializer.serialize` on the `{ data }` object, handling standard type markers (`~d` for Date, `~e` for Error). The client deserializes each chunk payload with `serializer.deserialize`.

These two layers don't conflict — they handle different types. This matches the existing request pattern where MongoDB resolvers return `serialize(result)` (ObjectId → `_oid`) and the API layer applies `serializer.serialize` (Date → `~d`).

**Why this works for all use cases:**

- **Type-safe serialization.** All `{ data }` payloads go through `serializer.serialize/deserialize`, preserving Date, ObjectId, Error, etc. — critical for MongoDB and other data-heavy streams.
- **Zero framework dependencies.** No AI SDK on client or server framework code.
- **Non-AI native.** MongoDB aggregation streams, large exports, real-time logs all fit naturally.
- **Stable.** We control the protocol. No risk of upstream breaking changes.
- **Debuggable.** Standard SSE visible in browser DevTools.

### Plugin Level: AI SDK as an Implementation Detail

The AI SDK protocol is **not** a framework concern — it's how an AI plugin internally communicates with LLM providers. The plugin uses the AI SDK to get rich features (reasoning, citations, tool calls), then maps them into Lowdefy's `onChunk` calls.

**Separation of concerns:**

```
┌─────────────────────────────────────────────────────────┐
│  Framework (Lowdefy SSE)                                │
│  3 event types: chunk, complete, error                  │
│  All payloads serialized/deserialized                   │
│  Works for ANY stream: AI, MongoDB, exports, logs       │
└──────────────────────┬──────────────────────────────────┘
                       │ onChunk({ data })
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│ MongoDB      │ │ Simple AI    │ │ Advanced AI Plugin   │
│ Plugin       │ │ Plugin       │ │ (uses AI SDK)        │
│              │ │              │ │                      │
│ cursor.next()│ │ openai.chat  │ │ streamText() from    │
│ → onChunk    │ │ .create()   │ │ AI SDK, maps:        │
│  ({ data:    │ │ → onChunk   │ │  text-delta → data   │
│    document })│ │  ({ data:   │ │  reasoning → data    │
│              │ │    text })   │ │  tool-call → data    │
│              │ │              │ │  citation → data     │
└──────────────┘ └──────────────┘ └──────────────────────┘
```

**Example: Advanced AI plugin using AI SDK internally (targets AI SDK v4.x — event type names may differ across versions):**

```javascript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

async function OpenAIAdvancedStream({ request, connection, onChunk, signal }) {
  const result = streamText({
    model: openai(connection.model),
    messages: request.messages,
    maxTokens: request.maxTokens,
    abortSignal: signal,
  });

  // Consume the AI SDK stream and map to Lowdefy onChunk calls
  for await (const event of result.fullStream) {
    if (signal?.aborted) break;

    switch (event.type) {
      case 'text-delta':
        // Text delta → pushed onto response.data as structured object
        onChunk({ data: { type: 'text', content: event.textDelta } });
        break;

      case 'reasoning':
        // Reasoning → pushed onto response.data as structured object
        onChunk({ data: { type: 'reasoning', text: event.textDelta } });
        break;

      case 'tool-call':
        // Tool calls → pushed onto response.data
        onChunk({
          data: {
            type: 'tool_call',
            toolName: event.toolName,
            args: event.args,
            toolCallId: event.toolCallId,
          },
        });
        break;

      case 'tool-result':
        // Tool results → pushed onto response.data
        onChunk({
          data: {
            type: 'tool_result',
            toolCallId: event.toolCallId,
            result: event.result,
          },
        });
        break;

      case 'source':
        // Citations → pushed onto response.data
        onChunk({
          data: {
            type: 'citation',
            url: event.source.url,
            title: event.source.title,
          },
        });
        break;
    }
  }

  const usage = await result.usage;
  const finishReason = await result.finishReason;

  return {
    usage: {
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    },
    finishReason,
  };
}
```

**YAML for the advanced AI plugin:**

```yaml
streams:
  - id: chat
    type: OpenAIAdvancedStream
    connectionId: openai
    payload:
      messages:
        _state: chatMessages
    properties:
      model: gpt-4o
      maxTokens: 4096
      messages:
        _payload: messages

blocks:
  - id: sendButton
    type: Button
    properties:
      title: Send
    events:
      onClick:
        - id: start_stream
          type: Stream
          params: chat
        # After stream completes, extract citations into state for List block.
        # List blocks iterate over state[blockId], so stream data must be
        # copied into state for List rendering to work.
        - id: extract_citations
          type: SetState
          params:
            citations:
              _array.filter:
                on:
                  _stream: chat.response.data
                callback:
                  _eq:
                    - _arg: type
                    - citation

  # Streamed text response (filter text chunks from response.data, join content)
  - id: response
    type: Markdown
    properties:
      content:
        _array.join:
          on:
            _array.map:
              on:
                _array.filter:
                  on:
                    _stream: chat.response.data
                  callback:
                    _eq:
                      - _arg: type
                      - text
              callback:
                _arg: content
          separator: ''

  # Reasoning (filter data chunks by type)
  - id: reasoning
    type: Markdown
    visible:
      _gt:
        - _array.length:
            _array.filter:
              on:
                _stream: chat.response.data
              callback:
                _eq:
                  - _arg: type
                  - reasoning
        - 0
    properties:
      content:
        _array.map:
          on:
            _array.filter:
              on:
                _stream: chat.response.data
              callback:
                _eq:
                  - _arg: type
                  - reasoning
          callback:
            _arg: text

  # Citations list — List blocks iterate over state[blockId], so citations
  # are extracted from stream data into state via the extract_citations action
  # above. The List renders after stream completion when state.citations is set.
  - id: citations
    type: List
    blocks:
      - id: citations.$.link
        type: Anchor
        properties:
          href:
            _state: citations.$.url
          title:
            _state: citations.$.title
```

**Why this is the right boundary:**

1. **Framework stays simple.** 3 event types, serialized payloads, works for everything.
2. **AI complexity is opt-in.** Simple AI plugins just do `onChunk({ data: text })`. Advanced plugins use the AI SDK internally for reasoning, tool calling, citations — then map to `onChunk({ data })` calls.
3. **No framework dependency on AI SDK.** The `ai` package is a dependency of `@lowdefy/connection-ai`, not of `@lowdefy/api` or `@lowdefy/engine`.
4. **MongoDB, exports, logs use the same framework.** No AI-specific concepts leak into the transport layer.
5. **AI SDK version changes are contained.** If Vercel breaks the protocol again, only the AI plugin needs updating. The framework and all non-AI plugins are unaffected.
6. **Plugin ecosystem grows naturally.** A basic AI plugin ships first (`onChunk({ data: text })`). An advanced plugin adds reasoning/citations/tools later. Users pick the plugin that matches their needs.

---

## Files Changed Summary

| Layer         | File                                                                             | Change                                                                       |
| ------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Schema**    | `packages/build/src/lowdefySchema.js`                                            | Add `streams` to page schema                                                 |
| **Build**     | `packages/build/src/build/buildPages/buildBlock/buildStreams.js`                 | New — validate + transform stream defs (uses `ConfigError` + `configKey`)    |
| **Build**     | `packages/build/src/build/writeStreams.js`                                       | New — write stream artifacts                                                 |
| **Build**     | `packages/build/src/build/buildTypes.js`                                         | Count stream types                                                           |
| **Build**     | `packages/build/src/utils/createPluginTypesMap.js`                               | Map `streams` from `types.js`                                                |
| **Build**     | `packages/build/src/build/buildImports/`                                         | Generate stream imports                                                      |
| **Build**     | `packages/build/src/build/writePluginImports/`                                   | Write stream import file                                                     |
| **API**       | `packages/api/src/routes/stream/callStream.js`                                   | New — stream pipeline handler                                                |
| **API**       | `packages/api/src/routes/stream/callStreamResolver.js`                           | New — callback-based resolver exec (`PluginError`/`ServiceError` wrapping)   |
| **API**       | `packages/api/src/routes/request/callRequest.js`                                 | Refactor — extract shared preparation logic                                  |
| **Server**    | `packages/servers/server/pages/api/stream/[pageId]/[streamId].js`                | New — SSE route (production)                                                 |
| **Server**    | `packages/servers/server-dev/pages/api/stream/[pageId]/[streamId].js`            | New — SSE route (dev)                                                        |
| **Engine**    | `packages/engine/src/Streams.js`                                                 | New — stream state manager (parallel to Requests.js, threads `actionId`)     |
| **Engine**    | `packages/engine/src/actions/createStream.js`                                    | New — `Stream` action factory                                                |
| **Engine**    | `packages/engine/src/actions/createCancelStream.js`                              | New — `CancelStream` action factory                                          |
| **Engine**    | `packages/engine/src/actions/getActionMethods.js`                                | Add `stream`/`cancelStream` to action methods (currently only has `request`) |
| **Engine**    | `packages/engine/src/getContext.js`                                              | Initialize `Streams` class alongside `Requests`                              |
| **Client**    | `packages/client/src/createCallStream.js`                                        | New — HTTP factory for stream calls                                          |
| **Client**    | `packages/client/src/streamRequest.js`                                           | New — fetch + ReadableStream SSE consumer                                    |
| **Client**    | `packages/client/src/initLowdefyContext.js`                                      | Initialize `callStream` alongside `callRequest`                              |
| **Actions**   | `packages/plugins/actions/actions-core/src/actions.js`                           | Export `Stream` and `CancelStream` action types                              |
| **Operators** | `packages/plugins/operators/operators-js/src/operators/client/stream.js`         | New — `_stream` operator (no loading gate, full entry access)                |
| **Operators** | `packages/plugins/operators/operators-js/src/operators/client/stream_details.js` | New — `_stream_details` operator (access stream history/metadata)            |
| **Operators** | `packages/plugins/operators/operators-js/src/operatorsClient.js`                 | Export `_stream` and `_stream_details`                                       |
| **Operators** | `packages/operators/src/webParser.js`                                            | Pass `streams: this.context.streams` to operator invocations                 |
| **Plugin**    | Connection plugin `types.js`                                                     | Add `streams` key                                                            |
| **Build**     | `packages/build/src/build/buildPages/buildBlock/buildEvents.js`                  | Validate `Stream`/`CancelStream` action refs against stream IDs              |
| **Build**     | `packages/build/src/build/jit/shallowBuild.js`                                   | Add `pages.*.streams` to shallow stop paths                                  |
| **Build**     | `packages/build/src/build/jit/createPageRegistry.js`                             | Include `streams` in raw page content                                        |
| **Build**     | `packages/build/src/build/jit/buildPageJit.js`                                   | Extract/delete/write `streams` alongside `requests`                          |
| **Build**     | `packages/build/src/build/jit/writePageJit.js`                                   | Write stream artifacts alongside request artifacts                           |
| **Plugin**    | Connection plugin `connections.js`                                               | Add `streams` map to connection exports                                      |

**Total**: ~30 new/modified files across 7 packages.

---

## Implementation Phases

### Phase 1: Core Streaming

- Build pipeline: schema, buildStreams (with `ConfigError` validation), writeStreams, type counting
- API: callStream pipeline, SSE route, callStreamResolver (with `PluginError`/`ServiceError` wrapping)
- Engine: Streams.js (with `actionId` threading), Stream action, CancelStream action
- Client: createCallStream, streamRequest (SSE consumer), throttled updates
- Operator: `_stream`

Deliverable: text streaming works end-to-end with a hardcoded test resolver.

### Phase 2: Plugin Integration

- Plugin type map: discover `streams` from `types.js`
- Import generation: stream resolvers bundled into build
- Runtime resolution: `connections[type].streams[streamType]`
- OpenAI + Anthropic stream resolvers in connection plugins

Deliverable: `@lowdefy/connection-ai` (or similar) with working stream resolvers.

### Phase 3: Polish

- Keep-alive pings for long-running streams
- Dev server hot-reload support for stream definitions
- Documentation and examples

### Testing Strategy

Each phase includes tests for its deliverables:

- **`buildStreams.js`**: validation errors (missing id, non-string id, missing connectionId, non-existent connection), duplicate stream ID detection, stream/request ID collision
- **`Streams.js`**: throttled chunk accumulation, cancellation (sets finishReason, preserves partial data), cancel+restart race (stale run: `loading` set to false, `finishReason` set, `abortController` deleted, partial `dataBuffer` flushed to `response.data`, no `update()` call, no error rethrow), error rethrow for blocking action, history array (`unshift` ordering, `responseTime`)
- **`_stream` operator**: dot-path resolution, numeric array indices, `$` in List context, returns `undefined` for non-existent streams
- **`_stream_details` operator**: access previous invocations, metadata fields (`payload`, `responseTime`, `actionId`), verify `abortController` not exposed
- **SSE parsing**: chunk boundary handling (split across `reader.read()` calls), malformed input, TextDecoder final flush, line buffer size guard, reader released on error (`reader.cancel()` in finally)
- **Server route**: SSE headers, error-after-headers (SSE error event, no re-throw), abort on client disconnect
- **Mock stream resolver**: simple counter that emits numbers for end-to-end testing without AI APIs
