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

import clampPanelWidth from './clampPanelWidth.js';

function getStorageKey({ methods, panel }) {
  return methods.getAppStorageKey(`lf-${panel?.storageKey ?? 'rail-panel'}`);
}

function readStored({ methods, panel }) {
  try {
    const stored = JSON.parse(localStorage.getItem(getStorageKey({ methods, panel })));
    return stored && typeof stored === 'object' ? stored : {};
  } catch {
    // localStorage unavailable (privacy mode) or holding something else
    return {};
  }
}

function writeStored({ methods, panel, value }) {
  try {
    localStorage.setItem(getStorageKey({ methods, panel }), JSON.stringify(value));
  } catch {
    // localStorage unavailable
  }
}

// The panel's width and whether it is open. On a desktop the panel sits beside the content and
// a person collapses it; the width and the collapse are kept in localStorage, shared by every page
// of the app, so moving between places never moves the content's left edge. On a tablet or phone
// the panel is a drawer over the content: it opens closed, unless the page asks for it open with
// `panel.startOpen` (a list page with nothing picked yet), and its state is not stored.
function usePanelState({ methods, panel, limits, mode }) {
  const [stored, setStored] = useState(() => {
    const value = readStored({ methods, panel });
    return {
      width: clampPanelWidth({ width: value.width, ...limits }),
      collapsed: value.collapsed === true,
    };
  });
  const startOpen = panel?.startOpen === true;
  const [drawerOpen, setDrawerOpen] = useState(startOpen && mode !== 'desktop');

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setDrawerOpen(startOpen && mode !== 'desktop');
  }, [startOpen, mode]);

  const isDrawer = mode !== 'desktop';
  const open = isDrawer ? drawerOpen : !stored.collapsed;

  function save(next) {
    setStored(next);
    writeStored({ methods, panel, value: next });
  }

  function setOpen(nextOpen, source) {
    if (nextOpen === open) return;
    if (isDrawer) {
      setDrawerOpen(nextOpen);
    } else {
      save({ ...stored, collapsed: !nextOpen });
    }
    methods.triggerEvent({
      name: 'onPanelToggle',
      event: { open: nextOpen, mode, source },
    });
  }

  // `source` says what expanded a collapsed panel, for onPanelToggle.
  function commitWidth(width, { expand = false, source } = {}) {
    const next = {
      width: clampPanelWidth({ width, ...limits }),
      collapsed: expand ? false : stored.collapsed,
    };
    save(next);
    if (expand && stored.collapsed) {
      methods.triggerEvent({ name: 'onPanelToggle', event: { open: true, mode, source } });
    }
    methods.triggerEvent({ name: 'onPanelResize', event: { width: next.width } });
  }

  return {
    commitWidth,
    isDrawer,
    open,
    setOpen,
    toggle: (source) => setOpen(!open, source),
    width: stored.width,
  };
}

export default usePanelState;
