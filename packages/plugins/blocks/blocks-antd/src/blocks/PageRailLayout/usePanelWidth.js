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

import { useState } from 'react';

import { clampPanelWidth } from './clampPanelWidth.js';

function getStorageKey({ methods, panel }) {
  return methods.getAppStorageKey(`lf-${panel?.storageKey ?? 'rail-panel-width'}`);
}

function readStoredWidth({ methods, panel, limits }) {
  let stored;
  try {
    stored = Number(localStorage.getItem(getStorageKey({ methods, panel })));
  } catch {
    // localStorage unavailable (SSR, privacy mode)
  }
  // Number(null) is 0, which clamps to the minimum, so a missing value is told apart first.
  return clampPanelWidth({ width: stored || undefined, ...limits });
}

function writeStoredWidth({ methods, panel, width }) {
  try {
    localStorage.setItem(getStorageKey({ methods, panel }), String(width));
  } catch {
    // localStorage unavailable
  }
}

// The width is stored per app under panel.storageKey, so every page of the app opens the panel at
// the width the person last dragged it to.
function usePanelWidth({ methods, panel, limits }) {
  const [width, setWidth] = useState(() => readStoredWidth({ methods, panel, limits }));
  function commit(next) {
    setWidth(next);
    writeStoredWidth({ methods, panel, width: next });
    methods.triggerEvent({ name: 'onPanelResize', event: { width: next } });
  }
  return { width, setWidth, commit };
}

export default usePanelWidth;
