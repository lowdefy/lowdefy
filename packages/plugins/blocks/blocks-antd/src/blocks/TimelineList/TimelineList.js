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
import { Timeline } from 'antd';
import { get, mergeObjects, serializer, type } from '@lowdefy/helpers';

import { withBlockDefaults } from '@lowdefy/block-utils';
import withTheme from '../withTheme.js';

// antd 6 renamed the left and right mode and position values to start and end.
const placements = { left: 'start', right: 'end' };

// TODO: need to pass value to list blocks to render item level settings.
const TimelineList = ({
  blockId,
  classNames = {},
  components: { Icon },
  events,
  list,
  methods,
  properties,
  styles = {},
}) => {
  // Temporary fix until list blocks get value from state
  const value = properties.data;
  const items = (list || []).map((child, i) => {
    let icon = serializer.copy(get(value, `${i}.${properties.iconField ?? 'icon'}`));
    let style = get(value, `${i}.${properties.styleField ?? 'style'}`);
    if (type.isString(icon)) {
      icon = { name: icon };
    }
    if (!type.isObject(style)) {
      style = {};
    }
    const color = get(value, `${i}.${properties.colorField ?? 'color'}`);
    const position = get(value, `${i}.${properties.positionField ?? 'position'}`);
    return {
      key: `${blockId}_${i}`,
      color,
      placement: placements[position] ?? position,
      title: get(value, `${i}.${properties.labelField ?? 'label'}`),
      icon: icon && (
        <Icon
          blockId={`${blockId}_${i}_icon`}
          classNames={{ element: classNames.icon }}
          events={events}
          properties={mergeObjects([{ color }, icon])}
          styles={{ element: { ...style, ...styles.icon } }}
        />
      ),
      content: child.content && child.content(),
    };
  });
  // antd 6 dropped pending in favour of a loading item at the end of items.
  if (properties.pending) {
    items.push({
      key: `${blockId}_pending`,
      loading: true,
      content: type.isString(properties.pending) ? properties.pending : undefined,
      icon: properties.pendingDotIcon && (
        <Icon
          blockId={`${blockId}_pendingDotIcon`}
          classNames={{ element: classNames.pendingDotIcon }}
          events={events}
          properties={properties.pendingDotIcon}
          styles={{ element: { fontSize: 16, ...styles.pendingDotIcon } }}
        />
      ),
    });
  }
  return (
    <Timeline
      id={blockId}
      className={classNames.element}
      classNames={{ itemTitle: classNames.label }}
      items={items}
      mode={placements[properties.mode] ?? properties.mode}
      orientation={properties.orientation}
      reverse={properties.reverse}
      style={{ padding: '5px 0px 0px 5px', ...styles.element }}
      styles={{ itemTitle: styles.label }}
      titleSpan={properties.titleSpan}
      variant={properties.variant}
    />
  );
};

export default withTheme('Timeline', withBlockDefaults(TimelineList));
