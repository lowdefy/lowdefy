/*
  Copyright 2020-2024 Lowdefy, Inc

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

import useMutateCache from './utils/useMutateCache.js';
import waitForRestartedServer from './utils/waitForRestartedServer.js';

const Reload = ({ children, basePath, lowdefy }) => {
  const [reset, setReset] = useState(false);
  const [restarting, setRestarting] = useState(false);
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
        console.log('Reloaded config.');
      }, 600);
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
