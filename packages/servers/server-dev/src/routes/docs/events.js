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

import { streamSSE } from 'hono/streaming';

import { bootedAt, subscribe } from '../../../lib/docs/devEventBus.js';

// SSE push channel for agents without MCP support: the same dev events the MCP
// endpoint delivers as notifications/message, one SSE frame each, named by
// event type. The first frame is always the restart event so a reconnecting
// client can tell a server restart from a dropped connection.
async function docsEventsHandler(c) {
  return streamSSE(c, async (stream) => {
    let open = true;
    const writeEvent = (event) =>
      stream.writeSSE({ event: event.type, data: JSON.stringify(event) });

    // Subscribe and arm the abort hook before the first await: onAbort does not
    // fire for a listener added after the client has already gone.
    const unsubscribe = subscribe(writeEvent);
    stream.onAbort(() => {
      open = false;
      unsubscribe();
    });

    await writeEvent({ type: 'restart', timestamp: new Date().toISOString(), bootedAt });

    while (open) {
      await stream.sleep(15000);
      if (open) {
        await stream.writeSSE({ event: 'ping', data: '' });
      }
    }
  });
}

export default docsEventsHandler;
