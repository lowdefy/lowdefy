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

import React, { useEffect, useRef } from 'react';
import { Dropdown } from 'antd';
import getDropdownMenuIcons from '@lowdefy/blocks-antd/blocks/getDropdownMenuIcons.js';

import collectHeaderMenuItems from './collectHeaderMenuItems.js';

// The menu itself, mounted only while open and anchored to the bottom edge of the header cell.
// The first item takes focus when the menu opens (the ARIA menu button pattern), so arrow keys
// and Enter work however it was opened; choosing an item hands focus back to the header. Escape
// is taken in the capture phase, ahead of the Dropdown's own handler, so focus goes back to the
// column's menu button rather than to the (unfocusable) anchor. A submenu (enrichment's Run) opens
// to the side, so its arrow is the dropdown's right chevron (getDropdownMenuIcons, as the antd
// dropdown blocks pass it): the page's ConfigProvider gives menus an inline menu's down chevron,
// which antd would otherwise use here too.
function HeaderMenuDropdown({ api, col }) {
  const { items, handlers } = collectHeaderMenuItems({
    column: col.column,
    api,
    features: api.features.list,
  });
  const popupRef = useRef(null);
  useEffect(() => {
    let frame = 0;
    function focusMenu() {
      const item = popupRef.current?.querySelector('[role="menuitem"]:not([aria-disabled="true"])');
      if (item) {
        item.focus({ preventScroll: true });
      } else {
        frame = requestAnimationFrame(focusMenu);
      }
    }
    frame = requestAnimationFrame(focusMenu);
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      api.actions.closeHeaderMenu({ restoreFocus: true });
    }
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [api]);
  return (
    <Dropdown
      menu={{
        ...getDropdownMenuIcons({
          blockId: `${api.blockId}_header_menu`,
          Icon: api.components.Icon,
        }),
        items,
        onClick: ({ key }) => {
          api.actions.closeHeaderMenu({ restoreFocus: true });
          handlers.get(key)();
        },
      }}
      onOpenChange={(open, info) => {
        if (!open && info.source === 'trigger') api.actions.closeHeaderMenu();
      }}
      open
      placement="bottomRight"
      popupRender={(menu) => (
        <div
          className="lf-table-header-menu"
          data-col-key={col.key}
          data-lf-header-menu-popup=""
          ref={popupRef}
        >
          {menu}
        </div>
      )}
      trigger={['click']}
    >
      <span className="lf-table-header-anchor" />
    </Dropdown>
  );
}

export default HeaderMenuDropdown;
