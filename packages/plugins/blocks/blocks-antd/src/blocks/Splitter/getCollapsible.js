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
import { cn } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

// antd only draws its own arrows when no collapse icons are passed, so the default arrows are
// passed as app icons to follow the app icon set.
const defaultIcons = {
  horizontal: { start: 'chevron-left', end: 'chevron-right' },
  vertical: { start: 'chevron-up', end: 'chevron-down' },
};

function getCollapsible({ blockId, classNames, collapsible, events, Icon, orientation, styles }) {
  const sideIcons = orientation === 'vertical' ? defaultIcons.vertical : defaultIcons.horizontal;
  const icon = {};
  ['start', 'end'].forEach((side) => {
    const properties = collapsible?.icon?.[side];
    const isDefault = type.isNone(properties);
    icon[side] = (
      <Icon
        blockId={`${blockId}_collapseIcon_${side}`}
        // style.css gives the default arrows back the collapse button background that antd
        // drops for passed icons.
        classNames={{
          element: cn(classNames.collapseIcon, {
            'lf-splitter-default-collapse-icon': isDefault,
          }),
        }}
        events={events}
        properties={isDefault ? { name: sideIcons[side], title: '' } : properties}
        styles={{ element: styles.collapseIcon }}
      />
    );
  });
  return {
    motion: collapsible?.motion,
    icon,
  };
}

export default getCollapsible;
