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

import chokidar from 'chokidar';
import { streamSSE } from 'hono/streaming';

// SSE endpoint — notifies the client when build/reload is written so it can
// mutate the SWR cache and refetch config.
async function reloadHandler(c) {
  return streamSSE(c, async (stream) => {
    const watcher = chokidar.watch(['./build/reload'], {
      persistent: true,
      ignoreInitial: true,
    });

    let open = true;
    stream.onAbort(() => {
      open = false;
      watcher.close();
    });

    const reload = () => {
      stream.writeSSE({ event: 'reload', data: JSON.stringify({}) });
    };
    watcher.on('add', () => reload());
    watcher.on('change', () => reload());
    // Do not reload on unlink — cleanBuildDirectory deletes build/reload during
    // skeleton rebuilds, which would send a premature SSE event before the new
    // build artifacts are written. The real reload comes via add/change when
    // reloadClients() creates the file after the build completes.

    while (open) {
      await stream.sleep(15000);
      if (open) {
        await stream.writeSSE({ event: 'ping', data: '' });
      }
    }
  });
}

export default reloadHandler;
