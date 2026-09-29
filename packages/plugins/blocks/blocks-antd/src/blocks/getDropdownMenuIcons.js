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

import React from 'react';

function createExpandIcon({ blockId, Icon }) {
  return function DropdownExpandIcon() {
    return (
      <span className="ant-dropdown-menu-submenu-arrow">
        <Icon
          blockId={`${blockId}_expandIcon`}
          className="ant-dropdown-menu-submenu-arrow-icon"
          properties={{ name: 'chevron-right', title: '' }}
        />
      </span>
    );
  };
}

// One expand icon component per Icon component and block id, so it keeps its identity across
// renders (antd renders a function expandIcon as a component: a new function would remount it).
const expandIcons = new WeakMap();

function getExpandIcon({ blockId, Icon }) {
  if (!expandIcons.has(Icon)) expandIcons.set(Icon, new Map());
  const byBlockId = expandIcons.get(Icon);
  if (!byBlockId.has(blockId)) byBlockId.set(blockId, createExpandIcon({ blockId, Icon }));
  return byBlockId.get(blockId);
}

// antd's Dropdown only reaches its submenu arrow through the menu prop; the wrapper span keeps
// antd's arrow classes so its spacing and RTL styles still apply. The arrow is a function: antd's
// Menu takes a function expandIcon from the page's ConfigProvider (the client's inline-menu
// chevron, which turns up when open) over any element a Dropdown passes, so only a function here
// makes a submenu read as a flyout, with a right chevron that does not turn.
function getDropdownMenuIcons({ blockId, Icon }) {
  return {
    expandIcon: getExpandIcon({ blockId, Icon }),
    overflowedIndicator: (
      <Icon blockId={`${blockId}_overflowedIndicator`} properties={{ name: 'more', title: '' }} />
    ),
  };
}

export default getDropdownMenuIcons;
