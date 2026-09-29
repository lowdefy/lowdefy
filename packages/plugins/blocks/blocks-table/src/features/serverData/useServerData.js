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

import { useEffect, useRef, useState } from 'react';

import createServerStore from './createServerStore.js';

// In server mode the rows TanStack sees are the loaded rows of the block cache (for selection,
// row lookup and events); the display list, with its holes for unloaded rows, comes from
// useServerItems. One store per server config; a block landing re-renders the table.
function useServerData({ api, config, data }) {
  const { server } = config;
  const storeRef = useRef(null);
  if (server && storeRef.current?.server !== server) {
    storeRef.current?.store.dispose();
    storeRef.current = { server, store: createServerStore({ api, server }) };
  }
  const store = server ? storeRef.current.store : null;
  api.serverStore = store;
  // The server's count of matching rows (null until the first block lands); the record count
  // and the bulk bar's "all matching" read it.
  api.total = store ? store.getRecordCount() : undefined;
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (!store) return undefined;
    return store.subscribe(() => setVersion((version) => version + 1));
  }, [store]);
  useEffect(() => () => storeRef.current?.store.dispose(), []);
  return store ? store.getLoadedRows() : data;
}

export default useServerData;
