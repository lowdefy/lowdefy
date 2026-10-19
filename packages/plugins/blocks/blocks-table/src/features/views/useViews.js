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

import { useEffect, useMemo, useRef, useState } from 'react';
import { type } from '@lowdefy/helpers';

import compactView from './compactView.js';
import createViewsApi from './createViewsApi.js';
import findActiveView from './findActiveView.js';
import getViewKey from './getViewKey.js';
import getViewSliceDeps from './getViewSliceDeps.js';
import isViewDirty from './isViewDirty.js';
import normalizeViews from './normalizeViews.js';
import readMountPayload from './readMountPayload.js';
import useStableConfig from '../../core/useStableConfig.js';
import writePersistedView from './writePersistedView.js';

// Saved views (D7) and view persistence (D6). The active view is block UI state: it starts from
// the persisted payload, then `activeView`, then the first view, and follows `activeView` when the
// app changes it. The current view is compared with the active saved view for the dirty strip,
// and written to storage after every view change.
function useViews({ api, config, state }) {
  const viewsConfig = useStableConfig(api.properties.views);
  const views = useMemo(() => normalizeViews(viewsConfig), [viewsConfig]);
  const activeProp = api.properties.activeView;
  // By key: an object id (`{ _oid }`) is a new object every time the engine evaluates it.
  const activePropKey = type.isNone(activeProp) ? null : getViewKey(activeProp);
  const { persist } = config;
  const enabled = views.length > 0 || persist !== null;

  const mount = useRef(null);
  if (mount.current === null) {
    const payload = readMountPayload({ config });
    const mountedActive = findActiveView({ views, id: payload?.activeView ?? activeProp });
    mount.current = {
      activeId: payload?.activeView ?? activeProp ?? null,
      // Views that load after mount (from a request) load the active one, unless the table
      // mounted with a value of its own or a persisted view.
      pendingLoad: type.isNone(api.value) && payload === null && mountedActive === null,
    };
  }
  const [activeId, setActiveId] = useState(mount.current.activeId);
  const pendingLoad = useRef(mount.current.pendingLoad);
  const lastActiveProp = useRef(activePropKey);
  const active = useMemo(() => findActiveView({ views, id: activeId }), [views, activeId]);

  const viewDeps = getViewSliceDeps(state);
  const currentView = useMemo(() => (enabled ? api.getValue().view : null), [enabled, ...viewDeps]);
  const defaults = useMemo(() => (enabled ? api.resolveValue(null).view : null), [enabled, config]);
  const savedView = useMemo(
    () => (active === null ? null : api.resolveValue({ view: active.view }).view),
    [active, config]
  );
  const dirty =
    savedView !== null && isViewDirty({ current: currentView, saved: savedView, defaults });

  const viewsApi = createViewsApi({ api, active, currentView, dirty, setActiveId, views });
  api.views = viewsApi;

  useEffect(() => {
    if (lastActiveProp.current === activePropKey) return;
    lastActiveProp.current = activePropKey;
    pendingLoad.current = true;
    setActiveId(activeProp ?? null);
  }, [activePropKey]);

  useEffect(() => {
    if (!pendingLoad.current || active === null) return;
    pendingLoad.current = false;
    if (dirty) viewsApi.load(active);
  }, [active]);

  const lastWritten = useRef(null);
  useEffect(() => {
    if (persist === null) return;
    const payload = {
      view: compactView({ view: currentView, defaults }),
      activeView: active?.key ?? null,
    };
    const json = JSON.stringify(payload);
    if (json === lastWritten.current) return;
    lastWritten.current = json;
    writePersistedView({ persist, payload });
  }, [currentView, active, defaults, persist]);

  return null;
}

export default useViews;
