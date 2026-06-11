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

import getDevState from '../../lib/server/devState.js';

// SSE endpoint — the lowdefy() Vite plugin emits a reload event after every
// rebuild or page invalidation (in-process, replacing the watched
// build/reload signal file) so the client can mutate the SWR cache and
// refetch config.
async function reloadHandler(c) {
  const state = getDevState();
  return streamSSE(c, async (stream) => {
    let open = true;

    const reload = () => {
      stream.writeSSE({ event: 'reload', data: JSON.stringify({}) });
    };
    state.emitter.on('reload', reload);

    stream.onAbort(() => {
      open = false;
      state.emitter.off('reload', reload);
    });

    while (open) {
      await stream.sleep(15000);
      if (open) {
        await stream.writeSSE({ event: 'ping', data: '' });
      }
    }
  });
}

export default reloadHandler;
