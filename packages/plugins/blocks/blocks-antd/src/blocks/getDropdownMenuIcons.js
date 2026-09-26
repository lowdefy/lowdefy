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

// antd's Dropdown only reaches its submenu arrow through the menu prop; the wrapper
// span keeps antd's arrow classes so its spacing and RTL styles still apply.
function getDropdownMenuIcons({ blockId, Icon }) {
  return {
    expandIcon: (
      <span className="ant-dropdown-menu-submenu-arrow">
        <Icon
          blockId={`${blockId}_expandIcon`}
          className="ant-dropdown-menu-submenu-arrow-icon"
          properties={{ name: 'chevron-right', title: '' }}
        />
      </span>
    ),
    overflowedIndicator: (
      <Icon blockId={`${blockId}_overflowedIndicator`} properties={{ name: 'more', title: '' }} />
    ),
  };
}

export default getDropdownMenuIcons;
