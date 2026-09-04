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

import React, { useEffect, useState } from 'react';

import useMutateCache from '../lib/client/utils/useMutateCache.js';
import waitForRestartedServer from '../lib/client/utils/waitForRestartedServer.js';

// SSE listener — config rebuilds notify via /api/reload. Tailwind CSS updates
// arrive through Vite HMR now (globals.css is in the dev module graph), so
// the old tailwind-jit.css link cache-bust is gone.
const Reload = ({ children, basePath, lowdefy }) => {
  const [reset, setReset] = useState(false);
  const [restarting, setRestarting] = useState(false);
  // reset is a one-shot boolean the engine lowers only after a page mounts
  // (getContext.js) — while a page is suspended it stays true and setReset(true)
  // bails out of re-rendering. The tick always changes, so every reload event
  // re-invokes Routing's render prop, which re-reads reloadVersion and mints a
  // fresh Suspense/SWR key — a suspended tab recovers instead of stranding on
  // the building screen.
  const [, setReloadTick] = useState(0);
  const mutateCache = useMutateCache(basePath);
  useEffect(() => {
    const sse = new EventSource(`${basePath}/api/reload`);

    sse.addEventListener('reload', () => {
      // add a update delay to prevent rerender before server is shut down for rebuild, ideally we don't want to do this.
      // TODO: We need to pass a flag when a rebuild will happen so that client does not trigger render.
      setTimeout(async () => {
        await mutateCache();
        if (lowdefy._internal?.initialised) {
          lowdefy._internal.initialised = false;
        }
        setReset(true);
        setReloadTick((tick) => tick + 1);
        console.log('Reloaded config.');
      }, 600);
    });

    // Dev notices (the `dev_notice` event on lib/docs/devEventBus.js) - not errors, but things the
    // developer should see while building, e.g. a tenant: none request that
    // ran unscoped. Shown by the ErrorBar at info level.
    sse.addEventListener('dev-notice', (event) => {
      const entry = JSON.parse(event.data);
      lowdefy._runtimeErrorCallback?.({
        type: entry.name,
        level: 'info',
        message: entry.message,
        source: entry.source,
      });
    });

    sse.onerror = () => {
      setRestarting(true);
      console.log('Rebuilding Lowdefy App.');
      sse.close();
      waitForRestartedServer(basePath);
    };
    return () => {
      sse.close();
    };
  }, []);
  return <>{children({ reset, setReset, restarting })}</>;
};

export default Reload;
