/*
  Copyright 2020 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-tools';
import { get, mergeObjects, serializer, type } from '@lowdefy/helpers';

import Icon from '../Icon/Icon';

const TimelineBlock = ({ blockId, list, methods, properties }) => {
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
            methods={methods}
            properties={mergeObjects([{ style: { fontSize: 16 } }, properties.pendingDotIcon])}
          />
        )
      }
      reverse={properties.reverse}
      {...other}
    >
      {(list || []).map((child, i) => {
        let icon = serializer.copy(get(properties, `data.${i}.${properties.iconField || 'icon'}`));
        let styleDot = get(properties, `data.${i}.${properties.iconField || 'style'}`);
        if (type.isString(icon)) {
          icon = { name: icon };
        }
        if (!type.isObject(styleDot)) {
          styleDot = {};
        }
        return (
          <Timeline.Item
            key={`${blockId}_${i}`}
            color={get(properties, `data.${i}.${properties.colorField || 'color'}`)}
            position={get(properties, `data.${i}.${properties.positionField || 'position'}`)}
            dot={
              icon && (
                <Icon
                  blockId={`${blockId}_${i}_icon`}
                  methods={methods}
                  properties={mergeObjects([icon, { style: styleDot }])}
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

TimelineBlock.defaultProps = blockDefaultProps;

export default TimelineBlock;
