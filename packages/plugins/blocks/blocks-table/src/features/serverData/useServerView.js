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

import { useEffect, useMemo } from 'react';

import deriveValue from '../../core/deriveValue.js';
import pickServerView from './pickServerView.js';

// Watches the view (whichever feature owns sort, filter, search or group) and hands it to the
// store, which refetches from the top when it changes. Registers the internal `__tableFetch`
// event, a Request action for `data.request` (the pattern Upload uses for its policy request).
function useServerView({ api, config, state }) {
  const { server } = config;
  const store = api.serverStore;
  const value = useMemo(() => (server ? deriveValue({ state, api }) : null), [state, server]);
  const view = value ? pickServerView(value.view) : null;
  const viewKey = JSON.stringify(view);
  if (store) store.selected = value.selected;

  useEffect(() => {
    if (!server) return;
    api.methods.registerEvent({
      name: '__tableFetch',
      actions: [{ id: '__tableFetch', type: 'Request', params: [server.request] }],
    });
  }, [server]);

  useEffect(() => {
    if (!store) return;
    store.setView({ view, viewKey });
  }, [store, viewKey]);

  if (!store) return null;
  return { loading: store.isLoading(), pending: store.isPending() };
}

export default useServerView;
