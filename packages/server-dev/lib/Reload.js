/*
  Copyright 2020-2022 Lowdefy, Inc

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

const Reload = ({ children, basePath }) => {
  const [reset, setReset] = useState(false);
  const mutateCache = useMutateCache(basePath);
  useEffect(() => {
    const sse = new EventSource(`${basePath}/api/reload`);

    sse.addEventListener('reload', async () => {
      await mutateCache();
      setReset(true);
      console.log('Reloaded config.');
    });

    sse.onerror = () => {
      sse.close();
      waitForRestartedServer(basePath);
    };
    return () => {
      sse.close();
    };
  }, []);
  // TODO: reload needs to pass a flag that the server is restarting / installing types.
  return <>{children({ reset, setReset })}</>;
};

export default Reload;
