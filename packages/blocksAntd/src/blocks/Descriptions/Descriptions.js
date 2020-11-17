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
import { type } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { Descriptions } from 'antd';

const DescriptionsBlock = ({ blockId, properties }) => (
  <Descriptions
    id={blockId}
    title={properties.title}
    bordered={properties.bordered}
    column={properties.column}
    size={properties.size}
    layout={properties.layout}
    colon={properties.colon}
  >
    {type.isArray(properties.items)
      ? properties.items.map((item, i) =>
          type.isPrimitive(item) ? (
            <Descriptions.Item key={i} label={item} span={item}>
              {item}
            </Descriptions.Item>
          ) : (
            <Descriptions.Item key={i} label={item.label} span={item.span}>
              {item.value}
            </Descriptions.Item>
          )
        )
      : type.isObject(properties.items) &&
        Object.keys(properties.items).map((key, i) => (
          <Descriptions.Item key={i} label={key}>
            {type.isPrimitive(properties.items[key])
              ? `${properties.items[key]}`
              : `${JSON.stringify(properties.items[key])}`}
          </Descriptions.Item>
        ))}
  </Descriptions>
);

DescriptionsBlock.defaultProps = blockDefaultProps;

export default DescriptionsBlock;
