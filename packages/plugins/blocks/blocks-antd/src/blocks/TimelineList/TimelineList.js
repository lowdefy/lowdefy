/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';
import { get, mergeObjects, serializer, type } from '@lowdefy/helpers';

// TODO: need to pass value to list blocks to render item level settings.
const TimelineList = ({ blockId, components: { Icon }, events, list, methods, properties }) => {
  // Temporary fix until list blocks get value from state
  const value = properties.data;
  const other = {};
  if (properties.mode) {
    other.mode = properties.mode;
  }
  return (
    <Timeline
      id={blockId}
      className={methods.makeCssClass([{ padding: '5px 0px 0px 5px' }, properties.style])}
      pending={properties.pending}
      pendingDot={
        properties.pendingDotIcon && (
          <Icon
            blockId={`${blockId}_pendingDotIcon`}
            events={events}
            properties={mergeObjects([{ style: { fontSize: 16 } }, properties.pendingDotIcon])}
          />
        )
      }
      reverse={properties.reverse}
      {...other}
    >
      {(list || []).map((child, i) => {
        let icon = serializer.copy(get(value, `${i}.${properties.iconField ?? 'icon'}`));
        let style = get(value, `${i}.${properties.styleField ?? 'style'}`);
        if (type.isString(icon)) {
          icon = { name: icon };
        }
        if (!type.isObject(style)) {
          style = {};
        }
        const color = get(value, `${i}.${properties.colorField ?? 'color'}`);
        return (
          <Timeline.Item
            key={`${blockId}_${i}`}
            color={color}
            position={get(value, `${i}.${properties.positionField ?? 'position'}`)}
            label={get(value, `${i}.${properties.labelField ?? 'label'}`)}
            dot={
              icon && (
                <Icon
                  blockId={`${blockId}_${i}_icon`}
                  events={events}
                  properties={mergeObjects([{ style, color }, icon])}
                />
              )
            }
          >
            {child.content && child.content()}
          </Timeline.Item>
        );
      })}
    </Timeline>
  );
};

TimelineList.defaultProps = blockDefaultProps;
TimelineList.meta = {
  category: 'list',
  icons: [],
  styles: ['blocks/TimelineList/style.less'],
};

export default TimelineList;
