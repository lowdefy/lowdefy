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

import React, { Suspense } from 'react';

import LazyHeaderMenuDropdown from './LazyHeaderMenuDropdown.js';
import PopoverLoading from '../../core/PopoverLoading.js';
import MenuIcon from './MenuIcon.js';

// Header part: the menu button, shown on hover or focus of the header cell, over the end of the
// cell (it takes no room from the title). It is tabbable while its header cell is the grid's
// active cell, so Tab from a focused header reaches it and Enter opens the menu. The antd
// Dropdown (its own chunk, preloaded on hover or focus of the button) mounts only while the menu
// is open.
function HeaderMenuTrigger({ api, col, focused }) {
  if (!api.config.headerMenu) return null;
  const open = api.headerMenu.openKey === col.key;
  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Column menu"
        className="lf-table-header-button lf-table-header-menu-trigger"
        data-lf-header-menu=""
        data-open={open ? '' : undefined}
        onFocus={LazyHeaderMenuDropdown.preload}
        onPointerEnter={LazyHeaderMenuDropdown.preload}
        tabIndex={focused ? 0 : -1}
        type="button"
      >
        <MenuIcon />
      </button>
      {open ? (
        <Suspense
          fallback={
            <PopoverLoading
              anchor="header"
              onClose={() => api.actions.closeHeaderMenu()}
              placement="bottomRight"
            />
          }
        >
          <LazyHeaderMenuDropdown api={api} col={col} />
        </Suspense>
      ) : null}
    </>
  );
}

export default HeaderMenuTrigger;
