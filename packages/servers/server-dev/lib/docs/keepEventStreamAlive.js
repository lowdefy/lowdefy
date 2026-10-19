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

// The interval @hono/mcp pings its GET stream at.
const KEEP_ALIVE_MS = 30000;

// An SSE comment: every client skips it, and it resets their idle timers.
const KEEP_ALIVE_COMMENT = new TextEncoder().encode(': keep-alive\n\n');

// A tool call answered as an event stream sends nothing until it is done, and
// a journey can run for many minutes. HTTP clients end a response body that
// stays silent too long - Node's fetch after 5 minutes, which is what cut the
// lowdefy mcp shim off a long journey - and @hono/mcp keeps only its GET
// stream alive. Comments go between the transport's chunks, each of which is
// a whole event.
function keepEventStreamAlive({ response, intervalMs = KEEP_ALIVE_MS }) {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream') || response.body === null) {
    return response;
  }
  const reader = response.body.getReader();
  let timer;
  const body = new ReadableStream({
    start(controller) {
      timer = setInterval(() => controller.enqueue(KEEP_ALIVE_COMMENT), intervalMs);
    },
    async pull(controller) {
      let chunk;
      try {
        chunk = await reader.read();
      } catch (error) {
        clearInterval(timer);
        controller.error(error);
        return;
      }
      if (chunk.done) {
        clearInterval(timer);
        controller.close();
        return;
      }
      controller.enqueue(chunk.value);
    },
    cancel(reason) {
      clearInterval(timer);
      return reader.cancel(reason);
    },
  });
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export default keepEventStreamAlive;
